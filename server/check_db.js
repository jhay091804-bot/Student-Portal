const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('portal.db');

db.all("PRAGMA table_info(subjects);", (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("TABLE SCHEMA:");
  rows.forEach(r => console.log(`${r.cid}: ${r.name} (${r.type})`));
  
  db.all("SELECT * FROM subjects ORDER BY id DESC LIMIT 5;", (err, rows) => {
    console.log("\nLAST 5 SUBJECTS:");
    rows.forEach(r => console.log(JSON.stringify(r, null, 2)));
    db.close();
  });
});
