require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db: sqliteDb, initDb: initSqlite } = require('./database');
const { pool: pgPool, initDbPg } = require('./database_pg');
const { db: mysqlDb, initDbMysql } = require('./database_mysql');
const multer = require('multer');

// Database Switching Logic
const usePg = !!process.env.DATABASE_URL;
const useMysql = !!(process.env.DB_HOST || process.env.MYSQL_URL);
let db;

if (usePg) {
  console.log('🐘 PostgreSQL Mode Enabled');
  db = {
    get: (sql, params, cb) => {
      if (typeof params === 'function') {
        cb = params;
        params = [];
      }
      let i = 1;
      const pgSql = sql.replace(/\?/g, () => `$${i++}`);
      pgPool.query(pgSql, params, (err, res) => {
        if (cb) cb(err, res ? res.rows[0] : null);
      });
    },
    all: (sql, params, cb) => {
      if (typeof params === 'function') {
        cb = params;
        params = [];
      }
      let i = 1;
      const pgSql = sql.replace(/\?/g, () => `$${i++}`);
      pgPool.query(pgSql, params, (err, res) => {
        if (cb) cb(err, res ? res.rows : []);
      });
    },
    run: (sql, params, cb) => {
      if (typeof params === 'function') {
        cb = params;
        params = [];
      }
      let i = 1;
      const pgSql = sql.replace(/\?/g, () => `$${i++}`);
      pgPool.query(pgSql, params, (err, res) => {
        const result = { lastID: res?.rows?.[0]?.id, changes: res?.rowCount };
        if (cb) cb.call(result, err);
      });
    }
  };
} else if (useMysql) {
  console.log('🐬 MySQL Mode Enabled');
  db = mysqlDb;
} else {
  console.log('📂 SQLite Mode Enabled');
  db = sqliteDb;
  // Enable Foreign Key Support for Deletion Cascades
  db.run("PRAGMA foreign_keys = ON", (err) => {
    if (err) console.error('❌ Failed to enable PRAGMA foreign_keys:', err.message);
    else console.log('✅ SQLite PRAGMA foreign_keys = ON');
  });
}

const initDatabase = usePg ? initDbPg : (useMysql ? initDbMysql : initSqlite);

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

// --- SECURITY MIDDLEWARE ---

// Secure HTTP Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration - Restrict to Frontend + Railway Support
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL, 
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    // Allow if no origin (like same-origin requests) or if it matches whitelist/railway
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.up.railway.app')) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Healthcheck endpoint for Railway
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: process.env.MYSQL_URL ? 'MySQL' : 'SQLite',
    smtp: process.env.SMTP_USER && process.env.SMTP_PASS ? 'Configured' : 'Missing Credentials'
  });
});

// DEBUG: Test Email Connection
app.get('/api/debug/test-email', async (req, res) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({ error: 'SMTP credentials not set in environment variables' });
  }
  
  try {
    const result = await sendVerificationEmail(process.env.SMTP_USER, 'test-connection-token', 'System Admin');
    if (result) {
      res.json({ success: true, message: 'Test email sent to ' + process.env.SMTP_USER });
    } else {
      res.status(500).json({ 
        error: 'Email failed to send. This usually means Port 587 is blocked or Gmail credentials have spaces.',
        tip: 'Try changing SMTP_PORT to 465 in Railway variables and remove spaces from your password.'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code });
  }
});

// Serve Static Frontend (ONLY in Production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Rate Limiting - Prevent DDoS/Brute Force
const globalLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 2 minutes.' }
});
app.use('/api/', globalLimiter);

// Specific limiter for login
const loginLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, 
  max: 5, // 5 attempts per 2 mins
  skip: (req) => req.body && req.body.id === 'admin@chcci.edu.ph',
  message: { error: 'Too many login attempts. Account temporarily locked for 2 minutes.' }
});

// Middleware to handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map(err => ({ field: err.path, message: err.msg })) });
  }
  next();
};

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Admin Middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
};

// --- AUTH ENDPOINTS ---

app.post('/api/auth/login', 
  loginLimiter,
  body('id').trim().isLength({ min: 4 }).escape(),
  body('password').trim().notEmpty(),
  validate,
  (req, res) => {
    const { id, password } = req.body;
    
    db.get("SELECT * FROM users WHERE id = ? OR email = ?", [id, id], (err, user) => {
      if (err) return res.status(500).json({ error: 'Internal Server Error' });
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });

      // BLOCK UNVERIFIED STUDENTS (Admins are always verified)
      if (user.role === 'student' && user.is_verified === 0) {
        return res.status(403).json({ 
          message: 'Email verification required.',
          unverified: true,
          email: user.email 
        });
      }

      const validPassword = bcrypt.compareSync(password, user.password);
      if (!validPassword) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
      
      const { password: _, ...userData } = user;
      res.json({ token, user: userData });
    });
});

app.put('/api/auth/onboard', authenticateToken, 
  body('address').trim().notEmpty().escape(),
  body('phone').trim().notEmpty().escape(),
  body('program').trim().notEmpty().escape(),
  body('year').trim().notEmpty().escape(),
  validate,
  (req, res) => {
    const { address, phone, program, year } = req.body;
    const userId = req.user.id;

    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can be onboarded' });
    }

    db.run(
      "UPDATE users SET address = ?, phone = ?, program = ?, year = ?, is_onboarded = 1 WHERE id = ?",
      [address, phone, program, year, userId],
      function(err) {
        if (err) return res.status(500).json({ error: 'Failed to update profile' });
        
        db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
          if (err || !user) return res.status(500).json({ error: 'Failed to retrieve updated profile' });
          const { password: _, ...userData } = user;
          res.json({ success: true, user: userData });
        });
      }
    );
});

const { sendVerificationEmail } = require('./mailer');

app.post('/api/auth/register', 
  body('id').trim().isLength({ min: 8, max: 20 }).escape(),
  body('password').isLength({ min: 8 }),
  body('name').trim().isLength({ min: 2 }).escape(),
  body('email').isEmail().normalizeEmail(),
  validate,
  (req, res) => {
    const { id, password, name, email, program, year } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=800000&color=fff`;
    
    // Generate Secure Verification Token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    db.run(
      "INSERT INTO users (id, password, name, email, role, program, year, avatar, is_verified, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, hashedPassword, name, email, 'student', program, year, avatar, 0, verificationToken],
      function(err) {
        if (err) {
          const errMsg = err.message.toLowerCase();
          const isEmailConflict = errMsg.includes('email') || (errMsg.includes('duplicate entry') && errMsg.includes('email'));
          const isIdConflict = errMsg.includes('id') || (errMsg.includes('duplicate entry') && (errMsg.includes('primary') || errMsg.includes('id')));
          let message = 'Registration failed. Please check your details.';
          
          if (isEmailConflict) message = 'This email address is already registered.';
          else if (isIdConflict) message = 'This student ID is already registered.';
          
          console.error('❌ Registration Error:', err.message);
          return res.status(400).json({ error: message, details: err.message });
        }
        
        // REAL EMAIL DELIVERY (Asynchronous)
        sendVerificationEmail(email, verificationToken, name).catch(e => {
          console.error('❌ Async Mailer Error during registration:', e);
        });

        res.status(201).json({ 
          message: 'Account created! Please check your email to verify.',
          unverified: true 
        });
      }
    );
});

// Verification Endpoint
app.get('/api/auth/verify/:token', (req, res) => {
  const { token } = req.params;
  
  // Find user by token first to get their ID
  db.get("SELECT id FROM users WHERE verification_token = ?", [token], (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'Invalid or expired verification link.' });
    
    const studentId = user.id;
    
    // Perform update
    db.run("UPDATE users SET is_verified = 1, verification_token = NULL WHERE verification_token = ?", [token], function(err) {
      if (err) return res.status(500).json({ error: 'Internal verification error.' });
      
      res.json({ 
        message: 'Email verified successfully!',
        studentId: studentId
      });
    });
  });
});

// --- STUDENT CRUD (ADMIN ONLY) ---

app.get('/api/admin/students', authenticateToken, isAdmin, (req, res) => {
  db.all("SELECT * FROM users WHERE role = 'student' ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(row => {
      const { password, ...student } = row;
      return student;
    }));
  });
});

app.post('/api/admin/students', 
  authenticateToken, 
  isAdmin, 
  body('id').trim().notEmpty().escape(),
  body('name').trim().notEmpty().escape(),
  body('balance').isNumeric(),
  validate,
  (req, res) => {
    const { id, password, name, program, year, avg, balance } = req.body;
    const hashedPassword = bcrypt.hashSync(password || 'Password123!', 10);
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=800000&color=fff`;

    db.run(
      "INSERT INTO users (id, password, name, role, program, year, avg, balance, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, hashedPassword, name, 'student', program, year, avg || '0.00', balance || 0.00, avatar],
      function(err) {
        if (err) return res.status(400).json({ error: 'Enrollment failed. ID exists.' });
        res.status(201).json({ id, name, program, year, avg, balance, avatar });
      }
    );
});

app.put('/api/admin/students/:id', authenticateToken, isAdmin, (req, res) => {
  const { name, program, year, avg, balance, password } = req.body;
  const id = req.params.id;

  let query = "UPDATE users SET name = ?, program = ?, year = ?, avg = ?, balance = ? WHERE id = ?";
  let params = [name, program, year, avg, balance, id];

  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    query = "UPDATE users SET name = ?, program = ?, year = ?, avg = ?, balance = ?, password = ? WHERE id = ?";
    params = [name, program, year, avg, balance, hashedPassword, id];
  }

  db.run(query, params, function(err) {
    if (err) return res.status(400).json({ error: 'Update failed' });
    res.json({ message: 'Student updated successfully' });
  });
});

app.delete('/api/admin/students/:id', authenticateToken, isAdmin, (req, res) => {
  db.run("DELETE FROM users WHERE id = ? AND role = 'student'", [req.params.id], function(err) {
    if (err) {
      console.error('Delete Failure:', err.message);
      return res.status(500).json({ error: 'Deletion failed due to a database constraint.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Student not found or already deleted.' });
    }
    res.json({ message: 'Student and all related records deleted successfully' });
  });
});

// --- SUBJECT MANAGEMENT ---

app.get('/api/admin/students/:id/subjects', authenticateToken, isAdmin, (req, res) => {
  db.all("SELECT * FROM subjects WHERE student_id = ?", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Fetch subjects failed' });
    res.json(rows);
  });
});

app.post('/api/admin/students/:id/subjects', authenticateToken, isAdmin, (req, res) => {
  const { code, name, grade, units, time, room, days, instructor, status } = req.body;
  const student_id = req.params.id;

  console.log('[DEBUG] POST Subject Body:', req.body);

  if (!student_id || !code || !name) {
    console.error('Subject Add failed: Missing required fields', { student_id, code, name });
    return res.status(400).json({ error: 'Missing required subject data' });
  }

  const finalDays = (days && days.trim() !== '' && days !== 'TBA') ? days : 'TBA';
  console.log(`[DEBUG] Final Days for INSERT: "${finalDays}"`);

  db.run(
    "INSERT INTO subjects (student_id, code, name, grade, units, time, room, instructor, status, days) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [student_id, code, name, grade || '0.00', units || 3, time || 'TBA', room || 'TBA', instructor || 'TBA', status || 'Passed', finalDays],
    function(err) {
      if (err) {
        console.error('Database Error during Subject Add:', err.message);
        return res.status(400).json({ error: 'Could not add subject' });
      }
      res.status(201).json({ id: this.lastID, student_id, code, name, grade, units, time, room, instructor, status, days: finalDays });
    }
  );
});

app.put('/api/admin/subjects/:id', authenticateToken, isAdmin, (req, res) => {
  const { code, name, grade, units, time, room, days, instructor, status } = req.body;
  const id = req.params.id;

  console.log('[DEBUG] PUT Subject Body:', req.body);

  const finalDays = (days && days.trim() !== '' && days !== 'TBA') ? days : 'TBA';
  console.log(`[DEBUG] Final Days for UPDATE: "${finalDays}"`);

  db.run(
    "UPDATE subjects SET code = ?, name = ?, grade = ?, units = ?, time = ?, room = ?, instructor = ?, status = ?, days = ? WHERE id = ?",
    [code, name, grade, units, time, room, instructor, status, finalDays, id],
    function(err) {
      if (err) {
        console.error('Database Error during Subject Update:', err.message);
        return res.status(400).json({ error: 'Could not update subject' });
      }
      res.json({ message: 'Subject updated successfully', days: finalDays });
    }
  );
});

app.delete('/api/admin/subjects/:id', authenticateToken, isAdmin, (req, res) => {
  db.run("DELETE FROM subjects WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Removal failed' });
    res.json({ message: 'Subject removed successfully' });
  });
});// --- STUDENT WALL ENDPOINTS ---

app.get('/api/wall/posts', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT 
      p.*, 
      u.name as author_name, 
      u.avatar as author_avatar, 
      u.role as author_role,
      (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id) as reaction_count,
      (SELECT type FROM reactions r WHERE r.post_id = p.id AND r.user_id = ? LIMIT 1) as user_reaction_type,
      (SELECT 1 FROM reactions r WHERE r.post_id = p.id AND r.user_id = ?) as user_reacted,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.type = 'announcement' DESC, p.created_at DESC
  `;
  
  db.all(query, [userId, userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Fetch failed', details: err.message });
    res.json(rows);
  });
});

app.post('/api/wall/posts', 
  authenticateToken, 
  upload.single('image'),
  body('content').trim().escape(), // Remove .notEmpty() to allow image-only posts
  validate,
  (req, res) => {
    let { content, type } = req.body;
    const userId = req.user.id;
    const postType = (req.user.role === 'admin' && type === 'announcement') ? 'announcement' : 'post';
    const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url;

    // Fail-safe: If both content and image are missing, reject
    if (!content && !image_url) {
      return res.status(400).json({ error: 'Post must have either text or an image' });
    }

    // Ensure content is at least an empty string for the DB NOT NULL constraint
    if (!content) content = '';

    db.run(
      "INSERT INTO posts (user_id, content, type, image_url) VALUES (?, ?, ?, ?)",
      [userId, content, postType, image_url],
      function(err) {
        if (err) return res.status(500).json({ error: 'Post creation failed' });
        
        db.get(`
          SELECT p.*, u.name as author_name, u.avatar as author_avatar, u.role as author_role, 0 as reaction_count, 0 as user_reacted, 0 as comment_count
          FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?
        `, [this.lastID], (err, row) => {
          res.status(201).json(row);
        });
      }
    );
});

app.post('/api/wall/react', authenticateToken, (req, res) => {
  const { post_id, comment_id, type } = req.body;
  const userId = req.user.id;
  const reactionType = type || 'like';

  const targetCol = post_id ? 'post_id' : 'comment_id';
  const targetId = post_id || comment_id;

  db.get(`SELECT id, type FROM reactions WHERE ${targetCol} = ? AND user_id = ?`, [targetId, userId], (err, row) => {
    if (row) {
      if (row.type === reactionType) {
        // Toggle off if same type
        db.run("DELETE FROM reactions WHERE id = ?", [row.id], (err) => {
          if (err) return res.status(500).json({ error: 'Reaction removal failed' });
          res.json({ reacted: false, type: null });
        });
      } else {
        // Update type if different
        db.run("UPDATE reactions SET type = ? WHERE id = ?", [reactionType, row.id], (err) => {
          if (err) return res.status(500).json({ error: 'Reaction update failed' });
          res.json({ reacted: true, type: reactionType });
        });
      }
    } else {
      // Create new reaction
      const sql = post_id 
        ? "INSERT INTO reactions (post_id, user_id, type) VALUES (?, ?, ?)"
        : "INSERT INTO reactions (comment_id, user_id, type) VALUES (?, ?, ?)";
      
      db.run(sql, [targetId, userId, reactionType], function(err) {
        if (err) return res.status(500).json({ error: 'Reaction failed', details: err.message });
        res.json({ reacted: true, type: reactionType });
      });
    }
  });
});

app.get('/api/wall/posts/:id/comments', authenticateToken, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  const query = `
    SELECT 
      c.*, u.name, u.avatar, u.role,
      (SELECT COUNT(*) FROM reactions r WHERE r.comment_id = c.id) as reaction_count,
      (SELECT type FROM reactions r WHERE r.comment_id = c.id AND r.user_id = ? LIMIT 1) as user_reaction_type
    FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ? ORDER BY c.created_at ASC
  `;
  db.all(query, [userId, postId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Fetch failed' });
    res.json(rows);
  });
});

app.post('/api/wall/comments', authenticateToken, body('content').trim().notEmpty().escape(), validate, (req, res) => {
  const { post_id, content, parent_id } = req.body;
  const userId = req.user.id;
  
  db.run("INSERT INTO comments (post_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)", 
    [post_id, userId, content, parent_id || null], function(err) {
    if (err) return res.status(500).json({ error: 'Comment failed' });
    db.get("SELECT c.*, u.name, u.avatar, u.role, 0 as reaction_count FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?", [this.lastID], (err, row) => {
      res.status(201).json(row);
    });
  });
});

app.delete('/api/wall/posts/:id', authenticateToken, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  db.get("SELECT user_id FROM posts WHERE id = ?", [postId], (err, post) => {
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== userId && req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    db.run("DELETE FROM posts WHERE id = ?", [postId],(err) => {
      if (err) return res.status(500).json({ error: 'Deletion failed' });
      res.json({ message: 'Post deleted' });
    });
  });
});

const ADMIN_ID = 'admin@chcci.edu.ph';

// Get available students to chat with (Students only see Admin, Admins see Students)
app.get('/api/chat/contacts', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';
  
  if (isAdmin) {
    // Admins see all students
    db.all("SELECT id, name, avatar, program, year FROM users WHERE role = 'student' ORDER BY name ASC", [], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Fetch contacts failed' });
      res.json(rows);
    });
  } else {
    // Students ONLY see the Admin
    db.all("SELECT id, name, avatar FROM users WHERE role = 'admin' AND id = ?", [ADMIN_ID], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Fetch contacts failed' });
      res.json(rows);
    });
  }
});

// Student: Get messages with a specific person (admin or student)
app.get('/api/chat/messages/:otherId', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const otherId = req.params.otherId;
  const query = `
    SELECT * FROM messages 
    WHERE (sender_id = ? AND receiver_id = ?) 
       OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
  `;
  db.all(query, [userId, otherId, otherId, userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Fetch messages failed' });
    res.json(rows);
  });
});

// Student/Admin: Get all my recent conversations (history)
app.get('/api/chat/conversations', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';
  
  let query;
  let params;

  if (isAdmin) {
    // Admins see all students who have messaged OR been messaged
    // Refactored to LEFT JOIN so students with no messages yet still appear if desired, 
    // but better yet, let's keep it to people with history BUT also provide a way to find students.
    query = `
      SELECT u.id, u.name, u.avatar, u.program, u.year,
        (SELECT content FROM messages WHERE (sender_id = u.id OR receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE (sender_id = u.id OR receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message_at,
        (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread_count
      FROM users u
      WHERE u.role = 'student'
      AND (
        EXISTS (SELECT 1 FROM messages WHERE sender_id = u.id OR receiver_id = u.id)
        OR 1=1 -- Show all students for Admin for now so they can initiate chat
      )
      ORDER BY last_message_at DESC, u.name ASC
    `;
    params = [userId];
  } else {
    // Students ONLY see their conversation with Admin
    query = `
      SELECT DISTINCT u.id, u.name, u.avatar, u.program, u.year,
        (SELECT content FROM messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message_at,
        (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread_count
      FROM users u
      JOIN messages m ON (u.id = m.sender_id OR u.id = m.receiver_id)
      WHERE u.id = ?
      AND (m.sender_id = ? OR m.receiver_id = ?)
      ORDER BY last_message_at DESC
    `;
    params = [userId, userId, userId, userId, userId, ADMIN_ID, userId, userId];
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Conversations error:', err);
      return res.status(500).json({ error: 'Fetch conversations failed' });
    }
    res.json(rows);
  });
});

// Student: Send message to anyone (Enforced Admin-only for students)
app.post('/api/chat/messages', authenticateToken, body('content').trim().notEmpty().escape(), validate, (req, res) => {
  const senderId = req.user.id;
  const isStudent = req.user.role === 'student';
  const { content, receiver_id } = req.body;
  
  // If student, override receiver to ADMIN_ID to be safe
  const recipient = isStudent ? ADMIN_ID : (receiver_id || null);
  
  if (!recipient) return res.status(400).json({ error: 'Receiver ID required' });

  db.run(
    "INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)",
    [senderId, recipient, content],
    function(err) {
      if (err) return res.status(500).json({ error: 'Message send failed' });
      res.status(201).json({ id: this.lastID, sender_id: senderId, receiver_id: recipient, content, created_at: new Date() });
    }
  );
});

// Mark messages from a specific peer as read
app.put('/api/chat/messages/read/:peerId', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const peerId = req.params.peerId;
  db.run("UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?", [peerId, userId], (err) => {
    if (err) return res.status(500).json({ error: 'Mark as read failed' });
    res.json({ success: true });
  });
});

// --- CALENDAR EVENTS ---

// Get all events
app.get('/api/calendar/events', authenticateToken, (req, res) => {
  db.all("SELECT * FROM events ORDER BY date ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Fetch events failed' });
    res.json(rows);
  });
});

// Admin: Add event
app.post('/api/calendar/events', authenticateToken, isAdmin, body('title').trim().notEmpty().escape(), body('date').isDate(), validate, (req, res) => {
  const { title, date, type, color, description } = req.body;
  db.run("INSERT INTO events (title, date, type, color, description) VALUES (?, ?, ?, ?, ?)",
    [title, date, type || 'event', color || 'bg-yellow-500', description],
    function(err) {
      if (err) return res.status(500).json({ error: 'Event creation failed' });
      res.json({ id: this.lastID, title, date, type, color, description });
    }
  );
});

// Admin: Delete event
app.delete('/api/calendar/events/:id', authenticateToken, isAdmin, (req, res) => {
  db.run("DELETE FROM events WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Event deletion failed' });
    res.json({ message: 'Event deleted' });
  });
});

// Admin: Get list of students who have messaged
app.get('/api/admin/chat/conversations', authenticateToken, isAdmin, (req, res) => {
  const query = `
    SELECT DISTINCT u.id, u.name, u.avatar, u.program, u.year,
      (SELECT content FROM messages WHERE (sender_id = u.id OR receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT created_at FROM messages WHERE (sender_id = u.id OR receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message_at,
      (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread_count
    FROM users u
    JOIN messages m ON (u.id = m.sender_id OR u.id = m.receiver_id)
    WHERE u.role = 'student'
    ORDER BY last_message_at DESC
  `;
  db.all(query, [ADMIN_ID], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Fetch conversations failed' });
    res.json(rows);
  });
});

// Admin: Get all pending applications
app.get('/api/admin/organizations/applications', authenticateToken, isAdmin, (req, res) => {
  const query = `
    SELECT m.id, m.org_id, m.status, m.applied_at, u.name as student_name, u.program, u.year, o.name as org_name
    FROM organization_members m
    JOIN users u ON m.user_id = u.id
    JOIN organizations o ON m.org_id = o.id
    WHERE m.status = 'pending'
    ORDER BY m.applied_at DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Fetch applications failed' });
    res.json(rows);
  });
});

// Admin: Get messages for a specific student
app.get('/api/admin/chat/messages/:studentId', authenticateToken, isAdmin, (req, res) => {
  const studentId = req.params.studentId;
  const query = `
    SELECT * FROM messages 
    WHERE (sender_id = ? AND receiver_id = ?) 
       OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
  `;
  
  // Mark as read when admin opens the chat
  db.run("UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?", [studentId, ADMIN_ID], () => {});

  db.all(query, [studentId, ADMIN_ID, ADMIN_ID, studentId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Fetch messages failed' });
    res.json(rows);
  });
});

// Admin: Send message to a student
app.post('/api/admin/chat/messages/:studentId', authenticateToken, isAdmin, body('content').trim().notEmpty().escape(), validate, (req, res) => {
  const studentId = req.params.studentId;
  const { content } = req.body;

  db.run(
    "INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)",
    [ADMIN_ID, studentId, content],
    function(err) {
      if (err) return res.status(500).json({ error: 'Message send failed' });
      res.status(201).json({ sender_id: ADMIN_ID, receiver_id: studentId, content, created_at: new Date() });
    }
  );
});

// --- STUDENT ENDPOINTS ---

app.get('/api/student/subjects', authenticateToken, (req, res) => {
  db.all("SELECT * FROM subjects WHERE student_id = ?", [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Fetch failed' });
    res.json(rows);
  });
});

app.post('/api/student/payment', authenticateToken, (req, res) => {
  const { amount, method } = req.body;
  const student_id = req.user.id;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, student_id], function(err) {
    if (err) return res.status(500).json({ error: 'Payment failed' });
    db.get("SELECT balance FROM users WHERE id = ?", [student_id], (err, row) => {
      res.json({ message: 'Payment successful', newBalance: row.balance });
    });
  });
});

app.put('/api/student/profile', authenticateToken, (req, res) => {
  const { name, phone, address, password } = req.body;
  const student_id = req.user.id;
  let query = "UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?";
  let params = [name, phone, address, student_id];
  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    query = "UPDATE users SET name = ?, phone = ?, address = ?, password = ? WHERE id = ?";
    params = [name, phone, address, hashedPassword, student_id];
  }
  db.run(query, params, function(err) {
    if (err) return res.status(400).json({ error: 'Update failed' });
    db.get("SELECT id, name, email, phone, address, role, program, year, avatar FROM users WHERE id = ?", [student_id], (err, row) => {
      res.json({ message: 'Profile updated', user: row });
    });
  });
});

// --- SYSTEM STATS (ADMIN) ---
app.get('/api/admin/stats', authenticateToken, isAdmin, (req, res) => {
  const stats = {};
  
  db.get("SELECT COUNT(*) as count FROM users WHERE role = 'student'", (err, row) => {
    stats.totalStudents = row ? row.count : 0;
    
    db.get("SELECT SUM(balance) as totalBalance FROM users WHERE role = 'student'", (err, row) => {
      stats.totalBalance = row ? row.totalBalance : 0;
      stats.criticalAverage = '0.00'; // Reset to static
      db.all("SELECT program, COUNT(*) as count FROM users WHERE role = 'student' GROUP BY program", (err, rows) => {
        stats.programDistribution = rows || [];
        res.json(stats);
      });
    });
  });
});

// --- ORGANIZATION ACTIONS ---

// Get all organizations (with status for current user)
app.get('/api/organizations', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT o.*, 
      (SELECT status FROM organization_members WHERE org_id = o.id AND user_id = ?) as membership_status
    FROM organizations o
    ORDER BY o.name ASC
  `;
  db.all(query, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Fetch organizations failed' });
    res.json(rows);
  });
});

// Admin: Create organization
app.post('/api/organizations', authenticateToken, isAdmin, body('name').trim().notEmpty().escape(), validate, (req, res) => {
  const { name, description, type, icon, color } = req.body;
  db.run("INSERT INTO organizations (name, description, type, icon, color, members_count) VALUES (?, ?, ?, ?, ?, 0)",
    [name, description, type || 'Other', icon || 'MessageCircle', color || 'text-gray-600'],
    function(err) {
      if (err) return res.status(500).json({ error: 'Org creation failed' });
      res.json({ id: this.lastID, name, description, type, icon, color, members_count: 0 });
    }
  );
});

// Admin: Delete organization
app.delete('/api/organizations/:id', authenticateToken, isAdmin, (req, res) => {
  db.run("DELETE FROM organizations WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Org deletion failed' });
    res.json({ message: 'Organization deleted' });
  });
});

// --- ORGANIZATION ACTIONS ---

// Get all organizations (with status for current user)
app.get('/api/organizations', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT o.*, 
      (SELECT status FROM organization_members WHERE org_id = o.id AND user_id = ?) as membership_status
    FROM organizations o
    ORDER BY o.name ASC
  `;
  db.all(query, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Fetch organizations failed' });
    res.json(rows);
  });
});

// Admin: Create organization
app.post('/api/organizations', authenticateToken, isAdmin, body('name').trim().notEmpty().escape(), validate, (req, res) => {
  const { name, description, type, icon, color } = req.body;
  db.run("INSERT INTO organizations (name, description, type, icon, color, members_count) VALUES (?, ?, ?, ?, ?, 0)",
    [name, description, type || 'Other', icon || 'MessageCircle', color || 'text-gray-600'],
    function(err) {
      if (err) return res.status(500).json({ error: 'Org creation failed' });
      res.json({ id: this.lastID, name, description, type, icon, color, members_count: 0 });
    }
  );
});

// Admin: Delete organization
app.delete('/api/organizations/:id', authenticateToken, isAdmin, (req, res) => {
  db.run("DELETE FROM organizations WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Org deletion failed' });
    res.json({ message: 'Organization deleted' });
  });
});

// Student: Apply for organization
app.post('/api/organizations/:id/apply', authenticateToken, (req, res) => {
  const orgId = req.params.id;
  const userId = req.user.id;
  
  // Check if already applied
  db.get("SELECT * FROM organization_members WHERE org_id = ? AND user_id = ?", [orgId, userId], (err, row) => {
    if (row) return res.status(400).json({ error: 'Application already exists' });
    
    db.run("INSERT INTO organization_members (org_id, user_id, status) VALUES (?, ?, 'pending')", [orgId, userId], function(err) {
      if (err) return res.status(500).json({ error: 'Application failed' });
      res.json({ message: 'Application submitted' });
    });
  });
});

// Admin: Get all applications
app.get('/api/admin/organizations/applications', authenticateToken, isAdmin, (req, res) => {
  const query = `
    SELECT om.*, u.name as student_name, u.program, u.year, o.name as org_name
    FROM organization_members om
    JOIN users u ON om.user_id = u.id
    JOIN organizations o ON om.org_id = o.id
    WHERE om.status = 'pending'
  `;
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Fetch applications failed' });
    res.json(rows);
  });
});

// Admin: Update application status
app.put('/api/admin/organizations/applications/:id', authenticateToken, isAdmin, (req, res) => {
  const { status } = req.body;
  const appId = req.params.id;
  
  db.run("UPDATE organization_members SET status = ? WHERE id = ?", [status, appId], function(err) {
    if (err) return res.status(500).json({ error: 'Update failed' });
    
    // If approved, increment member count
    if (status === 'active') {
      db.run("UPDATE organizations SET members_count = members_count + 1 WHERE id = (SELECT org_id FROM organization_members WHERE id = ?)", [appId]);
    }
    
    res.json({ message: 'Status updated' });
  });
});

// --- AI CHATBOT ENGINE (Fully Real AI Experience) ---
const KNOWLEDGE_BASE = {
  admission: {
    keywords: ['enroll', 'admission', 'register', 'apply', 'start', 'how to'],
    responses: [
      "To start your journey at CHCCI, simply create an account on the landing page! After that, you can follow the step-by-step 'Enrollment Guide' in your new dashboard.",
      "The admission process is fully digital! Once you register, you can submit requirements and take the entrance exam schedule through this portal.",
      "Are you a new student? Welcome! You can begin enrollment by clicking 'Enroll Now' on our landing page and following the onscreen instructions."
    ]
  },
  financial: {
    keywords: ['pay', 'gcash', 'maya', 'balance', 'tuition', 'fee', 'price', 'cost', 'online banking'],
    responses: [
      "We support modern digital settlements! You can pay your tuition using GCash, Maya, or Online Banking directly via the 'Finance' module in your portal.",
      "Tuition fees can be managed in real-time. Once you log in, check the Finance tab for your current balance and multiple payment options.",
      "Looking for payment methods? We recommend GCash or Maya for the fastest processing. You can see your updated balance immediately after payment."
    ]
  },
  technical: {
    keywords: ['password', 'login', 'id', 'account', 'username', 'reset', 'forgot', 'access', 'cannot'],
    responses: [
      "Forgotten your password? Please contact the CHCCI IT Support desk or the Registrar's office to securely reset your credentials.",
      "Your Student ID (e.g., 5176-XXXX) is your permanent key to the portal. If you've lost it, we can help you retrieve it through the Registrar's department.",
      "Our portal follows strict security standards. If you're blocked, wait 2 minutes for the rate-limiter to reset, or contact support for a manual unlock."
    ]
  },
  institutional: {
    keywords: ['history', 'founded', 'where', 'location', 'concepcion', 'tarlac', 'accreditation', 'level', 'chcci'],
    responses: [
      "CHCCI was founded in 1985 and is located in the heart of Concepcion, Tarlac. We are committed to nurturing minds and building futures.",
      "We pride ourselves on our Level III official accreditation, ensuring that every CHCCI student receives a world-class education.",
      "Core Gateway College (CHCCI) has been a leading institution in Tarlac for over 40 years, focusing on academic excellence and youth empowerment."
    ]
  },
  general: {
    keywords: ['hello', 'hi', 'hey', 'help', 'what can you do', 'who are you', 'how'],
    responses: [
      "Hello! I am your CHCCI AI Assistant. I can help you with enrollment, tuition payments, or general campus information. How can I assist?",
      "Hi there! I'm here to guide you through the student portal. Ask me about registration, grades, or how to pay online!",
      "Greetings! I'm the digital mascot of CHCCI. I'm ready to help you navigate your academic journey. What's on your mind?"
    ]
  }
};

app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Empty message' });

  const query = message.toLowerCase();
  let bestCategory = 'general';
  let bestScore = 0;

  // Intent Scoring Engine
  for (const [cat, data] of Object.entries(KNOWLEDGE_BASE)) {
    let score = 0;
    data.keywords.forEach(kw => {
      if (query.includes(kw)) score += 1;
    });
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat;
    }
  }

  // Response Picking (Randomized for 'Real' feel)
  const categoryData = KNOWLEDGE_BASE[bestCategory];
  const response = categoryData.responses[Math.floor(Math.random() * categoryData.responses.length)];

  // Simulated Thinking Delay (500ms to 1500ms)
  const delay = Math.floor(Math.random() * 1000) + 500;
  
  setTimeout(() => {
    res.json({ response, category: bestCategory });
  }, delay);
});

// --- SYSTEM SETTINGS ---

app.get('/api/settings', (req, res) => {
  db.get("SELECT announcement FROM settings WHERE id = 'default'", [], (err, row) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch settings' });
    res.json(row || { announcement: 'Welcome to the CHCCI Student Portal!' });
  });
});

app.put('/api/settings', authenticateToken, isAdmin, (req, res) => {
  const { announcement } = req.body;
  db.run("UPDATE settings SET announcement = ? WHERE id = 'default'", [announcement], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to update settings' });
    res.json({ message: 'Settings updated successfully', announcement });
  });
});

// Final Catch-all for Frontend SPA (Production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
}

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 CHCCI Secure Gateway active on port ${PORT}`);
    if (usePg) console.log('✅ Connected to Cloud PostgreSQL');
    else console.log('✅ Connected to Local SQLite');
  });
}).catch(err => {
  console.error("❌ Critical Database Initialization Error:", err);
  process.exit(1);
});
