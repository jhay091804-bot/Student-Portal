const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(__dirname, 'portal.db');
const sqliteDb = new sqlite3.Database(dbPath);

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

const migrate = async () => {
  console.log('🚀 Starting Migration: SQLite -> PostgreSQL...');
  
  const pgClient = await pgPool.connect();
  
  try {
    await pgClient.query('BEGIN');

    // 1. Migrate Users
    const users = await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM users", (err, rows) => err ? reject(err) : resolve(rows));
    });
    console.log(`👥 Migrating ${users.length} users...`);
    for (const user of users) {
      await pgClient.query(`
        INSERT INTO users (id, password, name, email, phone, address, role, program, year, avg, balance, avatar, is_verified, verification_token, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO NOTHING
      `, [user.id, user.password, user.name, user.email, user.phone, user.address, user.role, user.program, user.year, user.avg, user.balance, user.avatar, user.is_verified, user.verification_token, user.created_at]);
    }

    // 2. Migrate Subjects
    const subjects = await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM subjects", (err, rows) => err ? reject(err) : resolve(rows));
    });
    console.log(`📚 Migrating ${subjects.length} subjects...`);
    for (const s of subjects) {
      await pgClient.query(`
        INSERT INTO subjects (student_id, code, name, grade, units, time, room, days, instructor, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [s.student_id, s.code, s.name, s.grade, s.units, s.time, s.room, s.days, s.instructor, s.status]);
    }

    // 3. Migrate Posts
    const posts = await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM posts", (err, rows) => err ? reject(err) : resolve(rows));
    });
    console.log(`📝 Migrating ${posts.length} posts...`);
    for (const p of posts) {
      await pgClient.query(`
        INSERT INTO posts (id, user_id, content, type, image_url, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [p.id, p.user_id, p.content, p.type, p.image_url, p.created_at]);
    }

    // 4. Migrate Comments
    const comments = await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM comments", (err, rows) => err ? reject(err) : resolve(rows));
    });
    console.log(`💬 Migrating ${comments.length} comments...`);
    for (const c of comments) {
      await pgClient.query(`
        INSERT INTO comments (id, post_id, user_id, content, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [c.id, c.post_id, c.user_id, c.content, c.created_at]);
    }

    // 5. Migrate Reactions
    const reactions = await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM reactions", (err, rows) => err ? reject(err) : resolve(rows));
    });
    console.log(`❤️ Migrating ${reactions.length} reactions...`);
    for (const r of reactions) {
      await pgClient.query(`
        INSERT INTO reactions (id, post_id, user_id, type, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (post_id, user_id) DO NOTHING
      `, [r.id, r.post_id, r.user_id, r.type, r.created_at]);
    }

    await pgClient.query('COMMIT');
    console.log('✅ Migration Highly Successful!');
  } catch (e) {
    await pgClient.query('ROLLBACK');
    console.error('❌ Migration Failed:', e);
  } finally {
    pgClient.release();
    sqliteDb.close();
    process.exit();
  }
};

migrate();
