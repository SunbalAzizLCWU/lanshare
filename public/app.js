const socket = io();

const joinBtn = document.getElementById('joinBtn');
const deviceNameInput = document.getElementById('deviceNameInput');
const devicesList = document.getElementById('devicesList');
const notepad = document.getElementById('notepad');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const filesList = document.getElementById('filesList');
const toastContainer = document.getElementById('toastContainer');

let joined = false;
let notepadDebounceTimer = null;

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3000);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

function randomGuestName() {
  const number = Math.floor(1000 + Math.random() * 9000);
  return `Guest-${number}`;
}

function getDeviceName() {
  const trimmed = deviceNameInput.value.trim();
  return trimmed || randomGuestName();
}

function joinNetwork() {
  if (joined) {
    return;
  }

  const name = getDeviceName();
  socket.emit('join', name);
  joined = true;
  deviceNameInput.value = name;
  deviceNameInput.disabled = true;
  joinBtn.disabled = true;
  showToast(`Joined as ${name}`);
}

function renderDevices(list) {
  devicesList.innerHTML = '';

  list.forEach((device) => {
    const item = document.createElement('li');
    const dot = document.createElement('span');
    dot.style.display = 'inline-block';
    dot.style.width = '8px';
    dot.style.height = '8px';
    dot.style.borderRadius = '999px';
    dot.style.background = 'var(--accent)';
    dot.style.flex = '0 0 auto';

    const name = document.createElement('span');
    name.textContent = device.name;

    item.append(dot, name);
    devicesList.appendChild(item);
  });
}

function renderFile(file) {
  const item = document.createElement('li');

  const name = document.createElement('div');
  name.className = 'file-name';
  name.textContent = file.name;

  const meta = document.createElement('div');
  meta.className = 'file-meta';
  meta.textContent = `${formatBytes(file.size)} • ${file.uploadedBy}`;

  const link = document.createElement('a');
  link.href = file.url;
  link.download = '';
  link.textContent = 'Download';

  item.append(name, meta, link);
  filesList.prepend(item);
}

async function uploadFile(file) {
  showToast(`Uploading ${file.name}...`);

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadedBy', deviceNameInput.value.trim() || 'Guest');

    const response = await fetch('/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    showToast(`Uploaded ${file.name}`);
  } catch (_error) {
    showToast(`Upload failed: ${file.name}`);
  }
}

function handleFiles(fileList) {
  Array.from(fileList || []).forEach((file) => {
    uploadFile(file);
  });
}

function setDragState(active) {
  dropZone.classList.toggle('dragover', active);
}

joinBtn.addEventListener('click', joinNetwork);

deviceNameInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    joinNetwork();
  }
});

socket.on('devices-update', (list) => {
  renderDevices(list);
});

notepad.addEventListener('input', () => {
  window.clearTimeout(notepadDebounceTimer);
  notepadDebounceTimer = window.setTimeout(() => {
    socket.emit('notepad-update', notepad.value);
  }, 300);
});

socket.on('notepad-update', (text) => {
  if (document.activeElement !== notepad) {
    notepad.value = text;
  }
});

dropZone.addEventListener('click', () => {
  fileInput.click();
});

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  event.stopPropagation();
  setDragState(true);
});

dropZone.addEventListener('dragleave', (event) => {
  event.preventDefault();
  event.stopPropagation();
  setDragState(false);
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  event.stopPropagation();
  setDragState(false);
  handleFiles(event.dataTransfer.files);
});

fileInput.addEventListener('change', (event) => {
  handleFiles(event.target.files);
  fileInput.value = '';
});

document.addEventListener('dragover', (event) => {
  event.preventDefault();
});

document.addEventListener('drop', (event) => {
  event.preventDefault();
});

socket.on('new-file', (file) => {
  renderFile(file);
});