const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const DB_PATH = path.join(__dirname, 'data.db');

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS ideas (
    id INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT,
    author TEXT,
    votes INTEGER,
    timestamp INTEGER
  )`);
});

function addIdea(idea) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`INSERT INTO ideas (id, title, description, author, votes, timestamp) VALUES (?, ?, ?, ?, ?, ?)`);
    stmt.run(idea.id, idea.title, idea.description, idea.author, idea.votes, idea.timestamp, function(err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID });
    });
    stmt.finalize();
  });
}

function getIdeas() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM ideas ORDER BY id ASC', (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function getIdeaById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM ideas WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function incrementVote(id) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE ideas SET votes = votes + 1 WHERE id = ?', [id], function(err) {
      if (err) return reject(err);
      resolve({ changes: this.changes });
    });
  });
}

module.exports = { addIdea, getIdeas, getIdeaById, incrementVote };
