const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const initDbPg = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Users table
    await client.query(`
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
        balance NUMERIC DEFAULT 0.00,
        avatar TEXT,
        is_verified INTEGER DEFAULT 0,
        is_onboarded INTEGER DEFAULT 0,
        age INTEGER,
        religion TEXT,
        height TEXT,
        weight TEXT,
        birthdate DATE,
        nationality TEXT,
        verification_token TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Subjects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        grade TEXT DEFAULT '0.00',
        units INTEGER NOT NULL,
        time TEXT,
        room TEXT,
        days TEXT,
        instructor TEXT,
        status TEXT DEFAULT 'Passed'
      )
    `);

    // Posts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'post',
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Comments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reactions (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL DEFAULT 'like',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      )
    `);

    // Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        announcement TEXT NOT NULL DEFAULT 'Welcome to the CHCCI Student Portal!'
      )
    `);

    const settingsCheck = await client.query("SELECT id FROM settings WHERE id = 'default'");
    if (settingsCheck.rows.length === 0) {
      await client.query("INSERT INTO settings (id, announcement) VALUES ($1, $2)", ['default', 'Welcome to the CHCCI Student Portal!']);
    }

    await client.query('COMMIT');
    console.log('✅ PostgreSQL Database Initialized');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ PostgreSQL Initialization Error:', e);
    throw e;
  } finally {
    client.release();
  }
};

module.exports = { pool, initDbPg };
