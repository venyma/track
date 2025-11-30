const express = require('express');
const multer = require('multer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Storage
let users = [];
let videos = [];
let sessions = {};

// Middlewær
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Multah
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helpaz
function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

function authMiddleware(req, res, next) {
  const token = req.headers['authorization'];
  if (!token || !sessions[token]) return res.status(401).json({ error: 'Unauthorized' });
  req.user = sessions[token];
  next();
}

// ROOOTS routes ROUTES Routes

// Sign up
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) return res.status(400).json({ error: 'Username taken' });
  const id = users.length + 1;
  users.push({ id, username, password });
  res.json({ message: 'Account created' });
});

// log in
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const token = generateToken();
  sessions[token] = user;
  res.json({ token, userId: user.id });
});

// Upload vids
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

// Get vids
app.get('/videos', (req, res) => {
  const query = req.query.q || '';
  const result = videos.filter(v => v.title.includes(query) || v.description.includes(query));
  res.json(result);
});

// Account info
app.get('/user', authMiddleware, (req, res) => {
  res.json(req.user);
});

app.put('/user', authMiddleware, (req, res) => {
  const { username, password } = req.body;
  if (username) req.user.username = username;
  if (password) req.user.password = password;
  res.json(req.user);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
