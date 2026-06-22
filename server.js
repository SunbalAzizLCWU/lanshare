const fs = require('fs');
const path = require('path');
const os = require('os');
const express = require('express');
const http = require('http');
const multer = require('multer');
const QRCode = require('qrcode');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const uploadsDir = path.join(__dirname, 'uploads');
const publicDir = path.join(__dirname, 'public');

fs.mkdirSync(uploadsDir, { recursive: true });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir));

function getLanIp() {
  const interfaces = os.networkInterfaces();

  for (const interfaceEntries of Object.values(interfaces)) {
    for (const entry of interfaceEntries || []) {
      if (entry && entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }

  return '127.0.0.1';
}

const lanIp = getLanIp();
const lanUrl = `http://${lanIp}:${PORT}`;

const storage = multer.diskStorage({
  destination: (req, _file, callback) => {
    try {
      const roomId = getRequestIP(req);
      const roomUploadsDir = getRoomUploadsDir(roomId);
      fs.mkdirSync(roomUploadsDir, { recursive: true });
      callback(null, roomUploadsDir);
    } catch (error) {
      callback(error);
    }
  },
  filename: (_req, file, callback) => {
    callback(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

const rooms = new Map();

function normalizeIp(ip) {
  if (!ip) {
    return 'unknown';
  }

  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

function getRequestIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const rawIp = forwarded ? forwarded.split(',')[0].trim() : req.ip || req.socket?.remoteAddress;
  return normalizeIp(rawIp);
}

function getSocketIP(socket) {
  const forwarded = socket.handshake.headers['x-forwarded-for'];
  const rawIp = forwarded ? forwarded.split(',')[0].trim() : socket.handshake.address;
  return normalizeIp(rawIp);
}

function getRoomUploadsDir(roomId) {
  return path.join(uploadsDir, roomId);
}

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      devices: new Map(),
    });
  }

  return rooms.get(roomId);
}

function deleteRoomIfEmpty(roomId) {
  const room = rooms.get(roomId);

  if (!room || room.devices.size > 0) {
    return;
  }

  rooms.delete(roomId);
}

function cleanupUploads() {
  try {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);

    const roomDirectories = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];

    for (const roomDirectory of roomDirectories) {
      if (roomDirectory === '.gitkeep') {
        continue;
      }

      const roomPath = path.join(uploadsDir, roomDirectory);
      let stats;

      try {
        stats = fs.statSync(roomPath);
      } catch (error) {
        console.error(`Failed to inspect ${roomDirectory}:`, error);
        continue;
      }

      if (!stats.isDirectory()) {
        continue;
      }

      const files = fs.readdirSync(roomPath);

      for (const fileName of files) {
        if (fileName === '.gitkeep') {
          continue;
        }

        const filePath = path.join(roomPath, fileName);

        try {
          const fileStats = fs.statSync(filePath);

          if (fileStats.isFile() && fileStats.mtimeMs < cutoffTime) {
            fs.unlinkSync(filePath);
          }
        } catch (error) {
          console.error(`Failed to clean up ${fileName}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Upload cleanup failed:', error);
  }
}

function broadcastDevices(roomId) {
  const room = rooms.get(roomId);

  if (!room) {
    return;
  }

  io.to(roomId).emit(
    'devices-update',
    Array.from(room.devices.entries()).map(([id, name]) => ({ id, name }))
  );
}

app.post('/upload', (req, res) => {
  try {
    upload.single('file')(req, res, (error) => {
      try {
        if (error) {
          throw error;
        }

        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const roomId = getRequestIP(req);
        const room = getRoom(roomId);
        const uploadedAt = new Date().toISOString();

        const fileInfo = {
          name: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype,
          uploadedBy: req.body.uploadedBy || req.body.deviceName || 'Unknown',
          time: uploadedAt,
          url: `/uploads/${encodeURIComponent(req.file.filename)}`,
        };

        io.to(roomId).emit('new-file', fileInfo);
        return res.status(200).json(fileInfo);
      } catch (err) {
        return res.status(500).json({ error: err.message || 'Upload failed' });
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

app.get('/uploads/:filename', (req, res) => {
  try {
    const roomId = getRequestIP(req);
    const filename = path.basename(req.params.filename);
    const filePath = path.join(getRoomUploadsDir(roomId), filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.download(filePath, filename);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Download failed' });
  }
});

app.get('/qr', async (_req, res) => {
  try {
    const pngBuffer = await QRCode.toBuffer(lanUrl, {
      type: 'png',
      errorCorrectionLevel: 'M',
    });

    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(pngBuffer);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'QR generation failed' });
  }
});

io.on('connection', (socket) => {
  const roomId = getSocketIP(socket);

  socket.on('join', (deviceName) => {
    const room = getRoom(roomId);
    room.devices.set(socket.id, deviceName || 'Unknown');
    socket.data.roomId = roomId;
    socket.join(roomId);
    broadcastDevices(roomId);
  });

  socket.on('notepad-update', (text) => {
    socket.to(roomId).emit('notepad-update', text);
  });

  socket.on('disconnect', () => {
    const activeRoomId = socket.data.roomId || roomId;
    const room = rooms.get(activeRoomId);

    if (room) {
      room.devices.delete(socket.id);
      broadcastDevices(activeRoomId);
      deleteRoomIfEmpty(activeRoomId);
    }
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`LocalShare running at ${lanUrl}`);
  cleanupUploads();
  setInterval(cleanupUploads, 60 * 60 * 1000);
});