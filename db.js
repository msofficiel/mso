// db.js — connexion et structure de la base de données
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'albiher.db'));

// Table des messages reçus via le formulaire de contact du site public
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    project_type TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'nouveau',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Table admin — un seul compte, celui d'Oumar, pour se connecter à l'espace privé
db.exec(`
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  )
`);

// Création du compte admin par défaut s'il n'existe pas encore
function ensureAdmin() {
  const existing = db.prepare('SELECT * FROM admin WHERE email = ?').get('oumar@groupealbiher.fr');
  if (!existing) {
    const hash = bcrypt.hashSync('changeMoi123', 10);
    db.prepare('INSERT INTO admin (email, password_hash) VALUES (?, ?)').run('oumar@groupealbiher.fr', hash);
    console.log('Compte admin créé : oumar@groupealbiher.fr / changeMoi123 (à changer)');
  }
}

ensureAdmin();

module.exports = db;
