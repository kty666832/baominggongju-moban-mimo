const Database = require('better-sqlite3');
const path = require('path');
const DB_PATH = path.join(__dirname, 'data.db');
let db;

function initDatabase(fields) {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  const columns = fields.map(f => `"${f.name}" TEXT`).join(',\n    ');
  db.exec(`CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ${columns},
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  console.log('✅ 数据库初始化完成');
}

function insertRegistration(data, fields) {
  const names = fields.map(f => f.name);
  const cols = names.map(n => `"${n}"`).join(', ');
  const ph = names.map(() => '?').join(', ');
  const vals = names.map(n => data[n] || '');
  const stmt = db.prepare(`INSERT INTO registrations (${cols}) VALUES (${ph})`);
  return { id: stmt.run(...vals).lastInsertRowid };
}

function getAllRegistrations() {
  return db.prepare('SELECT * FROM registrations ORDER BY id DESC').all();
}

function getCount() {
  return db.prepare('SELECT COUNT(*) as count FROM registrations').get().count;
}

function getGroupStats(fieldName) {
  return db.prepare(`SELECT "${fieldName}" as group_name, COUNT(*) as count FROM registrations GROUP BY "${fieldName}" ORDER BY count DESC`).all();
}

function deleteRegistration(id) {
  return db.prepare('DELETE FROM registrations WHERE id = ?').run(id);
}

module.exports = { initDatabase, insertRegistration, getAllRegistrations, getCount, getGroupStats, deleteRegistration };
