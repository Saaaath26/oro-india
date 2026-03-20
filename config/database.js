require('dotenv').config();
const { Pool } = require('pg');

// Parse the connection string to handle SSL properly
const connectionString = process.env.DATABASE_URL;

// Database connection pool
const pool = new Pool({
    connectionString: connectionString,
    ssl: connectionString && connectionString.includes('sslmode=require') ? {
        rejectUnauthorized: false,
        require: true
    } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Test database connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Database connection error:', err);
});

// Database query helper
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('📊 Query executed', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('❌ Database query error:', error);
        throw error;
    }
};

// Initialize database tables
const initializeTables = async () => {
    try {
        // Users table
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255),
                role VARCHAR(50) DEFAULT 'student',
                school_name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // User progress table
        await query(`
            CREATE TABLE IF NOT EXISTS user_progress (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                subject VARCHAR(100) NOT NULL,
                chapter VARCHAR(100) NOT NULL,
                current_level VARCHAR(50) DEFAULT 'foundation',
                completed_levels TEXT[] DEFAULT '{}',
                best_scores JSONB DEFAULT '{}',
                attempts JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, subject, chapter)
            )
        `);

        // OTP storage table
        await query(`
            CREATE TABLE IF NOT EXISTS otp_storage (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) NOT NULL,
                otp VARCHAR(10) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Test attempts table
        await query(`
            CREATE TABLE IF NOT EXISTS test_attempts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                subject VARCHAR(100) NOT NULL,
                chapter VARCHAR(100) NOT NULL,
                level VARCHAR(50) NOT NULL,
                score INTEGER NOT NULL,
                total_questions INTEGER NOT NULL,
                time_taken INTEGER NOT NULL,
                answers JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Database tables initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing database tables:', error);
        throw error;
    }
};

module.exports = {
    pool,
    query,
    initializeTables
};