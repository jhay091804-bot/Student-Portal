const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

db.all("PRAGMA table_info(users)", (err, rows) => {
  if (err) {
    console.error('❌ Schema Check Failed:', err);
    process.exit(1);
  }
  console.log('--- Users Table Schema ---');
  rows.forEach(row => console.log(`${row.name} (${row.type})`));
  db.close();
});
