const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(__dirname, 'portal.db');
const sqliteDb = new sqlite3.Database(dbPath);

const migrate = async () => {
    console.log('🚀 Starting Migration: SQLite -> MySQL...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'portal_db',
        multipleStatements: true
    });

    try {
        // Disable FK checks for migration
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // 1. Migrate Users
        const users = await new Promise((resolve, reject) => {
            sqliteDb.all("SELECT * FROM users", (err, rows) => err ? reject(err) : resolve(rows));
        });
        console.log(`👥 Migrating ${users.length} users...`);
        await connection.query('TRUNCATE TABLE users');
        for (const user of users) {
            await connection.execute(`
                INSERT INTO users (id, password, name, email, phone, address, role, program, year, avg, balance, avatar, is_verified, verification_token, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [user.id, user.password, user.name, user.email, user.phone, user.address, user.role, user.program, user.year, user.avg, user.balance, user.avatar, user.is_verified, user.verification_token, user.created_at]);
        }

        // 2. Migrate Subjects
        const subjects = await new Promise((resolve, reject) => {
            sqliteDb.all("SELECT * FROM subjects", (err, rows) => err ? reject(err) : resolve(rows));
        });
        console.log(`📚 Migrating ${subjects.length} subjects...`);
        await connection.query('TRUNCATE TABLE subjects');
        for (const s of subjects) {
            await connection.execute(`
                INSERT INTO subjects (student_id, code, name, grade, units, time, room, days, instructor, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [s.student_id, s.code, s.name, s.grade, s.units, s.time, s.room, s.days, s.instructor, s.status]);
        }

        // 3. Migrate Posts
        const posts = await new Promise((resolve, reject) => {
            sqliteDb.all("SELECT * FROM posts", (err, rows) => err ? reject(err) : resolve(rows));
        });
        console.log(`📝 Migrating ${posts.length} posts...`);
        await connection.query('TRUNCATE TABLE posts');
        for (const p of posts) {
            await connection.execute(`
                INSERT INTO posts (id, user_id, content, type, image_url, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [p.id, p.user_id, p.content, p.type, p.image_url, p.created_at]);
        }

        // 4. Migrate Comments
        const comments = await new Promise((resolve, reject) => {
            sqliteDb.all("SELECT * FROM comments", (err, rows) => err ? reject(err) : resolve(rows));
        });
        console.log(`💬 Migrating ${comments.length} comments...`);
        await connection.query('TRUNCATE TABLE comments');
        for (const c of comments) {
            await connection.execute(`
                INSERT INTO comments (id, post_id, user_id, content, created_at)
                VALUES (?, ?, ?, ?, ?)
            `, [c.id, c.post_id, c.user_id, c.content, c.created_at]);
        }

        // 5. Migrate Reactions
        const reactions = await new Promise((resolve, reject) => {
            sqliteDb.all("SELECT * FROM reactions", (err, rows) => err ? reject(err) : resolve(rows));
        });
        console.log(`❤️ Migrating ${reactions.length} reactions...`);
        await connection.query('TRUNCATE TABLE reactions');
        for (const r of reactions) {
            await connection.execute(`
                INSERT INTO reactions (id, post_id, user_id, type, created_at)
                VALUES (?, ?, ?, ?, ?)
            `, [r.id, r.post_id, r.user_id, r.type, r.created_at]);
        }

        // 6. Migrate Messages
        const messages = await new Promise((resolve, reject) => {
            sqliteDb.all("SELECT * FROM messages", (err, rows) => err ? reject(err) : resolve(rows));
        });
        console.log(`✉️ Migrating ${messages.length} messages...`);
        await connection.query('TRUNCATE TABLE messages');
        for (const m of messages) {
            await connection.execute(`
                INSERT INTO messages (id, sender_id, receiver_id, content, is_read, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at]);
        }

        // Re-enable FK checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ Migration to MySQL Highly Successful!');
    } catch (e) {
        console.error('❌ Migration Failed:', e);
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    } finally {
        await connection.end();
        sqliteDb.close();
        process.exit();
    }
};

migrate();
