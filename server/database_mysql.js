const mysql = require('mysql2');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

// Connection Configuration
const mysqlConfig = process.env.MYSQL_URL ? {
    uri: process.env.MYSQL_URL // support for URI strings like mysql://user:pass@host:port/db
} : {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'portal_db'
};

// Create connection pool
const pool = mysql.createPool({
    ...mysqlConfig,
    multipleStatements: true, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

// Initial database structure check
const initDbMysql = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ MySQL Connection Established Successfully');
        
        // AUTO-INITIALIZATION: Check if 'users' table exists
        const [tables] = await connection.query("SHOW TABLES LIKE 'users'");
        
        if (tables.length === 0) {
            console.log('⚠️  MySQL Tables missing. Running auto-initialization...');
            const schemaPath = path.resolve(__dirname, 'mysql_schema.sql');
            if (fs.existsSync(schemaPath)) {
                const schemaSql = fs.readFileSync(schemaPath, 'utf8');
                await connection.query(schemaSql);
                console.log('🎉 MySQL Database initialized from mysql_schema.sql');
            } else {
                console.error('❌ Could not find mysql_schema.sql for auto-initialization');
            }
        } else {
            // REPAIR STEP: Ensure default admin exists and has valid hash
            const [adminRows] = await connection.query("SELECT * FROM users WHERE id = 'admin@chcci.edu.ph'");
            const adminHash = '$2a$10$UnIhRoRVOM6pddo6/UZX1ftnv7eA7xKD82b4lvInwfM22pC1'; // Admin123!
            
            if (adminRows.length === 0) {
                await connection.query(
                    "INSERT INTO users (id, password, name, role, email, avatar, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    ['admin@chcci.edu.ph', adminHash, 'System Admin', 'admin', 'admin@chcci.edu.ph', 'https://ui-avatars.com/api/?name=Admin', 1]
                );
                console.log('✅ Default Admin created safely');
            } else if (adminRows[0].password.includes('7R9.O.X')) {
                // If the old invalid placeholder hash is still there, fix it
                await connection.query(
                    "UPDATE users SET password = ? WHERE id = 'admin@chcci.edu.ph'",
                    [adminHash]
                );
                console.log('🔄 Default Admin password hash repaired successfully');
            }
        }
        
        connection.release();
    } catch (err) {
        console.error('❌ MySQL Initialization Failed:', err.message);
        // Don't throw here, allow the server to report errors via endpoints
    }
};

// --- DB SHIM FOR COMPATIBILITY ---
// This shim makes MySQL's API match the sqlite3-style API used in server.js
const db = {
    get: (sql, params, cb) => {
        if (typeof params === 'function') {
            cb = params;
            params = [];
        }
        promisePool.execute(sql.replace(/\?/g, (m, i) => '?'), params)
            .then(([rows]) => {
                if (cb) cb(null, rows[0]);
            })
            .catch(err => {
                if (cb) cb(err);
            });
    },
    all: (sql, params, cb) => {
        if (typeof params === 'function') {
            cb = params;
            params = [];
        }
        promisePool.execute(sql.replace(/\?/g, (m, i) => '?'), params)
            .then(([rows]) => {
                if (cb) cb(null, rows);
            })
            .catch(err => {
                if (cb) cb(err);
            });
    },
    run: function(sql, params, cb) {
        if (typeof params === 'function') {
            cb = params;
            params = [];
        }
        promisePool.execute(sql.replace(/\?/g, (m, i) => '?'), params)
            .then(([result]) => {
                const sqliteResult = { 
                    lastID: result.insertId, 
                    changes: result.affectedRows 
                };
                if (cb) cb.call(sqliteResult, null);
            })
            .catch(err => {
                if (cb) cb(err);
            });
    }
};

module.exports = { pool: promisePool, db, initDbMysql };
