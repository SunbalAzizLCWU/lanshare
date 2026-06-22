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
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    callback(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

const devices = new Map();

function cleanupUploads() {
  try {
    const files = fs.readdirSync(uploadsDir);
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);

    for (const fileName of files) {
      if (fileName === '.gitkeep') {
        continue;
      }

      const filePath = path.join(uploadsDir, fileName);

      try {
        const stats = fs.statSync(filePath);

        if (stats.isFile() && stats.mtimeMs < cutoffTime) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error(`Failed to clean up ${fileName}:`, error);
      }
    }
  } catch (error) {
    console.error('Upload cleanup failed:', error);
  }
}

function broadcastDevices() {
  io.emit(
    'devices-update',
    Array.from(devices.entries()).map(([id, name]) => ({ id, name }))
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

        const fileInfo = {
          name: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype,
          uploadedBy: req.body.uploadedBy || req.body.deviceName || 'Unknown',
          time: new Date().toISOString(),
          url: `/uploads/${encodeURIComponent(req.file.filename)}`,
        };

        io.emit('new-file', fileInfo);
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
    const filename = path.basename(req.params.filename);
    const filePath = path.join(uploadsDir, filename);

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
  socket.on('join', (deviceName) => {
    devices.set(socket.id, deviceName || 'Unknown');
    broadcastDevices();
  });

  socket.on('notepad-update', (text) => {
    socket.broadcast.emit('notepad-update', text);
  });

  socket.on('disconnect', () => {
    devices.delete(socket.id);
    broadcastDevices();
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