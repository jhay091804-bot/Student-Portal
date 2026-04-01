const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('--- Database Migration Started ---');
  
  // Add Email Column
  db.run("ALTER TABLE users ADD COLUMN email TEXT", (err) => {
    if (err) console.log('⚠️ email column already exists or error:', err.message);
    else {
      console.log('✅ Added email column');
      db.run("UPDATE users SET email = id || '@chcci.edu.ph' WHERE email IS NULL");
    }
  });

  // Add is_verified Column
  db.run("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0", (err) => {
    if (err) console.log('⚠️ is_verified column already exists or error:', err.message);
    else {
      console.log('✅ Added is_verified column');
      db.run("UPDATE users SET is_verified = 1"); // Verify existing users
    }
  });

  // Add verification_token Column
  db.run("ALTER TABLE users ADD COLUMN verification_token TEXT", (err) => {
    if (err) console.log('⚠️ verification_token column already exists or error:', err.message);
    else console.log('✅ Added verification_token column');
  });

  console.log('--- Migration Completed ---');
});

setTimeout(() => db.close(), 2000);
