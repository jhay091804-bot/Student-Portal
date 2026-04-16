-- Student Portal MySQL Schema (Fully Compatible Version)
-- This schema matches the backend code exactly to prevent errors.

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS reactions;
DROP TABLE IF EXISTS messages;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    address VARCHAR(255),
    role VARCHAR(20) DEFAULT 'student',
    program VARCHAR(50),
    year VARCHAR(50),
    avg VARCHAR(10) DEFAULT '0.00',
    balance DECIMAL(10, 2) DEFAULT 0.00,
    avatar VARCHAR(255),
    is_verified TINYINT(1) DEFAULT 0,
    verification_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Subjects Table (Matches SQLite layout for seamless integration)
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    grade VARCHAR(10) DEFAULT '0.00',
    units INT NOT NULL,
    time VARCHAR(50),
    room VARCHAR(50),
    days VARCHAR(50),
    instructor VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Passed',
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Social Feature: Posts
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'post', -- 'post' or 'announcement'
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Social Feature: Comments
CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    parent_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- 5. Social Feature: Reactions (Likes)
CREATE TABLE reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NULL,
    comment_id INT NULL,
    user_id VARCHAR(50) NOT NULL,
    type VARCHAR(20) DEFAULT 'like',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_post_user (post_id, user_id),
    INDEX idx_comment_user (comment_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Communication: Messages (Chat)
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id VARCHAR(50) NOT NULL,
    receiver_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Calendar Features: Events
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(20) DEFAULT 'event', -- 'academic', 'event', 'holiday', 'sports'
    color VARCHAR(50) DEFAULT 'bg-yellow-500',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Calendar Features: Events
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(20) DEFAULT 'event', -- 'academic', 'event', 'holiday', 'sports'
    color VARCHAR(50) DEFAULT 'bg-yellow-500',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Organization Features: Clubs
CREATE TABLE organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50), -- Academic, Arts, Sports, Tech
    icon VARCHAR(50),
    color VARCHAR(50),
    members_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Organization Features: Membership/Applications
CREATE TABLE organization_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT,
    user_id VARCHAR(50),
    role VARCHAR(50) DEFAULT 'member',
    status VARCHAR(20) DEFAULT 'pending', -- pending, active, rejected
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed Initial Admin
INSERT INTO users (id, password, name, email, role, avatar, is_verified) 
VALUES ('admin@chcci.edu.ph', '$2a$10$UnIhRoRVOM6pddo6/UZX1ftnv7eA7xKD82b4lvInwfM22pC1', 'System Admin', 'admin@chcci.edu.ph', 'admin', 'https://ui-avatars.com/api/?name=Admin&background=000&color=fff', 1);

-- Seed Initial Organizations
INSERT INTO organizations (name, description, type, icon, color, members_count) VALUES
('Student Supreme Council (SSC)', 'Official governing body of the student community.', 'Academic', 'Rocket', 'text-amber-600', 42),
('Google Developer Student Clubs', 'Empowering students with Google technologies.', 'Tech', 'Code', 'text-blue-600', 120),
('CHCCI Arts Guild', 'Expression through visual and performing arts.', 'Arts', 'Palette', 'text-purple-600', 45),
('CHCCI Gladiators', 'Competitive sports and athletic excellence.', 'Sports', 'Trophy', 'text-red-700', 85);

-- Password is Admin123!
