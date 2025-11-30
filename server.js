const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// storage
let users = [];
let videos = [];
let sessions = {};

// Middlefingerware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper functions
function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

function authMiddleware(req, res, next) {
  const token = req.headers['authorization'];
  if (!token || !sessions[token]) return res.status(401).json({ error: 'Unauthorized' });
  req.user = sessions[token];
  next();
}

// --- ROutes ---

// Serve html pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public/login.html')));
app.get('/upload', (req, res) => res.sendFile(path.join(__dirname, 'public/upload.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, 'public/settings.html')));

// Sign up
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) return res.status(400).json({ error: 'Username taken' });
  const id = users.length + 1;
  users.push({ id, username, password });
  res.json({ message: 'Account created' });
});

// Log in
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const token = generateToken();
  sessions[token] = user;
  res.json({ token, userId: user.id });
});

// Upload video
app.post('/videos', authMiddleware, upload.single('video'), (req, res) => {
  const { title, description } = req.body;
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const base64Data = file.buffer.toString('base64');
  const mimeType = file.mimetype;

  const video = {
    id: videos.length + 1,
    title,
    description,
    author: req.user.username,
    data: base64Data,
    mimeType
  };
  videos.push(video);
  res.json({ message: 'Video uploaded', videoId: video.id });
});

// Ge
app.get('/videos', (req, res) => {
  const query = req.query.q || '';
  const result = videos.filter(v => v.title.includes(query) || v.description.includes(query));
  res.json(result);
});

// Acc
app.get('/user', authMiddleware, (req, res) => {
  res.json(req.user);
});

// Updateinfo
app.put('/user', authMiddleware, (req, res) => {
  const { username, password } = req.body;
  if (username) req.user.username = username;
  if (password) req.user.password = password;
  res.json(req.user);
});

// Start sever
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
