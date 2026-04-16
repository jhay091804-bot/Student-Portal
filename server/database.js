const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'portal.db');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table (Admins and Students)
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          phone TEXT,
          address TEXT,
          role TEXT NOT NULL DEFAULT 'student',
          program TEXT,
          year TEXT,
          avg TEXT DEFAULT '0.00',
          balance REAL DEFAULT 0.00,
          avatar TEXT,
          is_verified INTEGER DEFAULT 0,
          verification_token TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // db.run("UPDATE users SET is_verified = 1 WHERE is_verified IS NULL OR is_verified = 0");
      // db.run(`UPDATE users SET email = id || '@chcci.edu.ph' WHERE email IS NULL OR email = ''`);
      const adminId = 'admin@chcci.edu.ph';
      db.get("SELECT id FROM users WHERE id = ?", [adminId], (err, row) => {
        if (!row) {
          const hashedPassword = bcrypt.hashSync('Admin123!', 10);
          db.run(
            "INSERT INTO users (id, password, name, role, avatar) VALUES (?, ?, ?, ?, ?)",
            [adminId, hashedPassword, 'System Admin', 'admin', 'https://ui-avatars.com/api/?name=Admin&background=000&color=fff']
          );
          console.log('Admin user seeded');
        }
      });

      // Seed Initial Student (Red)
      const studentId = '51762023';
      db.get("SELECT id FROM users WHERE id = ?", [studentId], (err, row) => {
        if (!row) {
          const hashedPassword = bcrypt.hashSync('Password123!', 10);
          db.run(
            "INSERT INTO users (id, password, name, role, program, year, avg, balance, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [studentId, hashedPassword, 'Red', 'student', 'BSCS', '3rd Year', '1.50', 3000.00, 'https://ui-avatars.com/api/?name=Red&background=800000&color=fff']
          );
          console.log('Initial student seeded');
          
          // Seed Initial Subjects for Red
          const subjects = [
            ['CS301', 'Software Engineering', '1.25', 3, '09:00 AM - 10:30 AM', 'Room 302', 'Mon, Wed', 'Dr. Santos', 'Passed'],
            ['CS302', 'Web Development', '1.50', 3, '01:00 PM - 02:30 PM', 'Comp Lab 1', 'Tue, Thu', 'Engr. Reyes', 'Passed'],
            ['CS303', 'Mobile Computing', '1.75', 3, '08:00 AM - 11:00 AM', 'Comp Lab 2', 'Fri', 'Ms. Garcia', 'Passed'],
            ['CS304', 'Networking 1', '1.50', 3, '09:00 AM - 12:00 PM', 'Room 405', 'Sat', 'Mr. Lopez', 'Passed'],
            ['GEN101', 'Ethics', '1.00', 3, '02:00 PM - 03:30 PM', 'Room 201', 'Mon, Wed', 'Dr. Cruz', 'Passed']
          ];
          
          subjects.forEach(s => {
            db.run(
              "INSERT INTO subjects (student_id, code, name, grade, units, time, room, days, instructor, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [studentId, ...s]
            );
          });
          console.log('Initial subjects seeded for Red');
        }
      });

      // Add phone and address columns if they don't exist (Backward Compatibility)
      db.run("ALTER TABLE users ADD COLUMN phone TEXT", (err) => {
        // Ignore error if column already exists
      });
      db.run("ALTER TABLE users ADD COLUMN address TEXT", (err) => {
        // Ignore error if column already exists
      });

      // Subjects table (Schedules and Grades)
      db.run(`
        CREATE TABLE IF NOT EXISTS subjects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id TEXT NOT NULL,
          code TEXT NOT NULL,
          name TEXT NOT NULL,
          grade TEXT DEFAULT '0.00',
          units INTEGER NOT NULL,
          time TEXT,
          room TEXT,
          days TEXT,
          instructor TEXT,
          status TEXT DEFAULT 'Passed',
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Migration: Add days column if missing
      db.run("ALTER TABLE subjects ADD COLUMN days TEXT", (err) => {
        // Ignore error if column already exists
      });

      // Posts table (Student Thoughts and Admin Announcements)
      db.run(`
        CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          content TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'post', -- 'post' or 'announcement'
          image_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Comments table
      db.run(`
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          user_id TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Reactions table (Likes)
      db.run(`
        CREATE TABLE IF NOT EXISTS reactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          user_id TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'like',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(post_id, user_id),
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Messages table (Chat)
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sender_id TEXT NOT NULL,
          sender_name TEXT,
          receiver_id TEXT NOT NULL,
          content TEXT NOT NULL,
          is_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Organizations Table
      db.run(`
        CREATE TABLE IF NOT EXISTS organizations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT,
          icon TEXT,
          color TEXT,
          members_count INTEGER DEFAULT 0
        )
      `);

      // Organization Members Table
      db.run(`
        CREATE TABLE IF NOT EXISTS organization_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          org_id INTEGER NOT NULL,
          user_id TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Seed Initial Organizations
      db.get("SELECT COUNT(*) as count FROM organizations", (err, row) => {
        if (row && row.count === 0) {
          const orgs = [
            ['Computing Society', 'Official organization for BSCS and BSIT students.', 'Academic', 'Cpu', 'text-blue-600'],
            ['Literary Club', 'The sanctuary for writers, poets, and storytellers.', 'Special Interest', 'BookOpen', 'text-rose-600'],
            ['Student Council', 'The central student government of CHCCI.', 'Leadership', 'ShieldCheck', 'text-amber-600'],
            ['Sports Guild', 'Promoting athleticism and school spirit through competitive sports.', 'Sports', 'Trophy', 'text-emerald-600']
          ];
          orgs.forEach(o => {
            db.run("INSERT INTO organizations (name, description, type, icon, color, members_count) VALUES (?, ?, ?, ?, ?, 0)", o);
          });
          console.log('✅ Default organizations seeded');
        }
      });

      // Complete initialization
      resolve();
    });
  });
};

module.exports = { db, initDb };
