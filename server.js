// server.js — le serveur principal : reçoit les requêtes et répond
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cle-secrete-a-changer-en-prod';

app.use(cors());
app.use(express.json());

// ---------- ROUTE 1 : recevoir un message depuis le formulaire du site public ----------
app.post('/api/contact', (req, res) => {
  const { name, email, type, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Nom, email et message sont obligatoires.' });
  }

  db.prepare(
    'INSERT INTO messages (name, email, project_type, message) VALUES (?, ?, ?, ?)'
  ).run(name, email, type || 'Non précisé', message);

  res.status(201).json({ success: true, msg: 'Message bien reçu.' });
});

// ---------- ROUTE 2 : connexion admin ----------
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const admin = db.prepare('SELECT * FROM admin WHERE email = ?').get(email);
  if (!admin) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  }

  const passwordOk = bcrypt.compareSync(password, admin.password_hash);
  if (!passwordOk) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  }

  // On crée un "ticket d'accès" temporaire (JWT) valable 24h
  const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

// ---------- Middleware : vérifie que la personne est bien connectée ----------
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Connexion requise.' });

  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session invalide ou expirée.' });
  }
}

// ---------- ROUTE 3 : récupérer tous les messages (protégée) ----------
app.get('/api/messages', requireAuth, (req, res) => {
  const messages = db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all();
  res.json(messages);
});

// ---------- ROUTE 4 : changer le statut d'un message (protégée) ----------
app.patch('/api/messages/:id', requireAuth, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE messages SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Serveur Albiher en ligne sur http://localhost:${PORT}`);
});
