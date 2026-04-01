require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db, initDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

// --- SECURITY MIDDLEWARE ---

// Secure HTTP Headers
app.use(helmet());

// CORS Configuration - Restrict to Frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
// Serve Static Frontend (ONLY in Production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Rate Limiting - Prevent DDoS/Brute Force
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api/', globalLimiter);

// Specific limiter for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, // 5 attempts per 15 mins
  message: { error: 'Too many login attempts. Account temporarily locked for 15 minutes.' }
});

// Middleware to handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map(err => ({ field: err.param, message: err.msg })) });
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
    
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
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
    const verificationToken = require('crypto').randomBytes(32).toString('hex');

    db.run(
      "INSERT INTO users (id, password, name, email, role, program, year, avatar, is_verified, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, hashedPassword, name, email, 'student', program, year, avatar, 0, verificationToken],
      function(err) {
        if (err) {
          const isEmailConflict = err.message.includes('email');
          const isIdConflict = err.message.includes('id');
          let message = 'Registration failed. Please check your details.';
          
          if (isEmailConflict) message = 'This email address is already registered.';
          else if (isIdConflict) message = 'This student ID is already registered.';
          
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
    if (err) return res.status(500).json({ error: 'Deletion failed' });
    res.json({ message: 'Student deleted successfully' });
  });
});

// --- SUBJECT MANAGEMENT ---

app.get('/api/admin/students/:id/subjects', authenticateToken, isAdmin, (req, res) => {
  db.all("SELECT * FROM subjects WHERE student_id = ?", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Fetch failed' });
    res.json(rows);
  });
});

app.post('/api/admin/students/:id/subjects', authenticateToken, isAdmin, (req, res) => {
  const { code, name, grade, units, time, room, instructor, status } = req.body;
  const student_id = req.params.id;

  if (!student_id || !code || !name) {
    console.error('Subject Add failed: Missing required fields', { student_id, code, name });
    return res.status(400).json({ error: 'Missing required subject data' });
  }

  db.run(
    "INSERT INTO subjects (student_id, code, name, grade, units, time, room, instructor, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [student_id, code, name, grade || '0.00', units || 3, time || 'TBA', room || 'TBA', instructor || 'TBA', status || 'Passed'],
    function(err) {
      if (err) {
        console.error('Database Error during Subject Add:', err.message);
        return res.status(400).json({ error: 'Could not add subject' });
      }
      res.status(201).json({ id: this.lastID, student_id, code, name, grade, units, time, room, instructor, status });
    }
  );
});

app.delete('/api/admin/subjects/:id', authenticateToken, isAdmin, (req, res) => {
  db.run("DELETE FROM subjects WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Removal failed' });
    res.json({ message: 'Subject removed successfully' });
  });
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

  // Update balance in users table
  db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, student_id], function(err) {
    if (err) return res.status(500).json({ error: 'Payment failed' });
    
    // Send back success and the new calculated balance (simple fetch)
    db.get("SELECT balance FROM users WHERE id = ?", [student_id], (err, row) => {
      res.json({ 
        message: `Payment of ₱${amount} via ${method} successful`,
        newBalance: row.balance,
        transaction: {
          date: new Date().toISOString().split('T')[0],
          description: `Online Payment (${method})`,
          amount: amount,
          type: 'Payment'
        }
      });
    });
  });
});

// --- SYSTEM STATS (ADMIN) ---
app.get('/api/admin/stats', authenticateToken, isAdmin, (req, res) => {
  const stats = {};
  
  db.get("SELECT COUNT(*) as count FROM users WHERE role = 'student'", (err, row) => {
    stats.totalStudents = row.count;
    
    db.get("SELECT SUM(balance) as totalBalance FROM users WHERE role = 'student'", (err, row) => {
      stats.totalBalance = row.totalBalance || 0;
      
      db.all("SELECT program, COUNT(*) as count FROM users WHERE role = 'student' GROUP BY program", (err, rows) => {
        stats.programDistribution = rows;
        res.json(stats);
      });
    });
  });
});

// --- ADMIN SETTINGS ---
let adminSettings = {
  campusName: 'Concepcion Holy Cross College Inc.',
  maintenanceMode: false,
  announcement: 'Reminder: Submission of clearance for the current semester is ongoing.'
};

app.get('/api/admin/settings', authenticateToken, isAdmin, (req, res) => {
  res.json(adminSettings);
});

app.post('/api/admin/settings', authenticateToken, isAdmin, (req, res) => {
  adminSettings = { ...adminSettings, ...req.body };
  res.json({ message: 'Settings updated successfully', settings: adminSettings });
});

// --- AI CHATBOT ENGINE (Fully Real AI Experience) ---
const KNOWLEDGE_BASE = {
  admission: {
    keywords: ['enroll', 'admission', 'register', 'apply', 'start', 'how to'],
    responses: [
      "To start your journey at CHCCI, simply create an account on the landing page! After that, you can follow the step-by-step 'Enrollment Guide' in your new dashboard.",
      "The admission process is fully digital! Once you register, you can submit requirements and take the entrance exam schedule through this portal.",
      "Are you a new student? Welcome! You can begin enrollment by clicking 'Enroll Now' on our morning page and following the onscreen instructions."
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
      "Our portal follows strict security standards. If you're blocked, wait 15 minutes for the rate-limiter to reset, or contact support for a manual unlock."
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

// Final Catch-all for Frontend SPA (Production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
}

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 CHCCI Secure Gateway active on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("❌ Critical Database Initialization Error:", err);
  process.exit(1);
});
