const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'portal_db'
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ Connected to MySQL for Migration');

        // 1. Update Comments table for nested replies
        console.log('📦 Updating comments table...');
        await connection.query(`
            ALTER TABLE comments 
            ADD COLUMN IF NOT EXISTS parent_id INT NULL,
            ADD CONSTRAINT fk_comment_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
        `);
        console.log('✅ Comments table updated.');

        // 2. Update Reactions table for comments and types
        console.log('📦 Updating reactions table...');
        // MySQL doesn't have "ADD COLUMN IF NOT EXISTS" in pure SQL easily for all versions, 
        // so we check if column exists first.
        const [columns] = await connection.query("SHOW COLUMNS FROM reactions LIKE 'comment_id'");
        if (columns.length === 0) {
            await connection.query(`
                ALTER TABLE reactions 
                ADD COLUMN comment_id INT NULL AFTER post_id,
                MODIFY COLUMN post_id INT NULL,
                ADD CONSTRAINT fk_reaction_comment FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
            `);
            
            // Remove the old unique constraint and add new ones
            try {
                await connection.query("ALTER TABLE reactions DROP INDEX post_id");
            } catch (e) { /* ignore if not exist */ }
            
            await connection.query("CREATE UNIQUE INDEX idx_post_user ON reactions (post_id, user_id)");
            await connection.query("CREATE UNIQUE INDEX idx_comment_user ON reactions (comment_id, user_id)");
        }
        
        console.log('✅ Reactions table updated.');
        
        await connection.end();
        console.log('🎉 Migration Successful!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Migration Failed:', err.message);
        process.exit(1);
    }
}

migrate();
