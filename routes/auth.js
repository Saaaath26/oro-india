const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query, initializeTables } = require('../config/database');
const { sendOTPEmail, sendWelcomeEmail } = require('../config/email');
const router = express.Router();

// Database initialization endpoint (for production setup)
router.post('/init-db', async (req, res) => {
    try {
        console.log('🚀 Initializing database tables...');
        await initializeTables();
        res.json({
            success: true,
            message: 'Database initialized successfully'
        });
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        res.status(500).json({
            success: false,
            error: 'Database initialization failed',
            details: error.message
        });
    }
});

// Database health check endpoint
router.get('/health', async (req, res) => {
    try {
        const result = await query('SELECT NOW() as current_time');
        res.json({
            success: true,
            message: 'Database connection healthy',
            timestamp: result.rows[0].current_time
        });
    } catch (error) {
        console.error('❌ Database health check failed:', error);
        res.status(500).json({
            success: false,
            error: 'Database connection failed',
            details: error.message
        });
    }
});

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP endpoint
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        // Check if user already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'User with this email already exists'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Delete any existing OTP for this email
        await query('DELETE FROM otp_storage WHERE email = $1', [email]);

        // Store OTP in database
        await query(
            'INSERT INTO otp_storage (email, otp, expires_at) VALUES ($1, $2, $3)',
            [email, otp, expiresAt]
        );

        // Send OTP email
        await sendOTPEmail(email, otp);

        res.json({
            success: true,
            message: 'OTP sent successfully to your email'
        });

    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send OTP. Please try again.'
        });
    }
});

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        console.log('📝 Registration attempt:', { 
            email: req.body.email, 
            role: req.body.role,
            hasOTP: !!req.body.otp 
        });
        
        const { firstName, lastName, email, password, role, schoolName, otp } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !password || !role || !otp) {
            console.log('❌ Missing required fields:', { firstName: !!firstName, lastName: !!lastName, email: !!email, password: !!password, role: !!role, otp: !!otp });
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        console.log('🔍 Verifying OTP for:', email);

        // Verify OTP
        const otpRecord = await query(
            'SELECT * FROM otp_storage WHERE email = $1 AND otp = $2 AND expires_at > NOW()',
            [email, otp]
        );

        if (otpRecord.rows.length === 0) {
            console.log('❌ Invalid or expired OTP for:', email);
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired OTP'
            });
        }

        console.log('✅ OTP verified, checking existing user');

        // Check if user already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            console.log('❌ User already exists:', email);
            return res.status(409).json({
                success: false,
                error: 'User with this email already exists'
            });
        }

        console.log('🔐 Hashing password');

        // Hash password
        const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

        console.log('👤 Creating user');

        // Create user
        const newUser = await query(
            `INSERT INTO users (name, email, password_hash, role, school_name) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, name, email, role, school_name`,
            [`${firstName} ${lastName}`, email, passwordHash, role, schoolName || null]
        );

        const user = newUser.rows[0];
        console.log('✅ User created with ID:', user.id);

        console.log('📊 Initializing user progress');

        // Initialize user progress for all subjects and chapters
        const subjects = ['science', 'social-science'];
        const chapters = {
            'science': ['light', 'carbon-compounds', 'life-processes', 'heredity', 'natural-resources'],
            'social-science': ['nationalism', 'forest-society', 'water-resources', 'agriculture', 'democracy']
        };

        for (const subject of subjects) {
            for (const chapter of chapters[subject]) {
                await query(
                    `INSERT INTO user_progress (user_id, subject, chapter, current_level, completed_levels, best_scores, attempts)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [user.id, subject, chapter, 'foundation', '{}', '{}', '{}']
                );
            }
        }

        console.log('✅ User progress initialized');

        // Delete used OTP
        await query('DELETE FROM otp_storage WHERE email = $1', [email]);

        console.log('🔑 Generating JWT token');

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Set HTTP-only cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Send welcome email (non-blocking)
        sendWelcomeEmail(email, user.name).catch(console.error);

        console.log('✅ Registration completed successfully for:', email);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                schoolName: user.school_name
            }
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail
        });
        
        res.status(500).json({
            success: false,
            error: 'Registration failed. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed. Please try again.'
        });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Find user
        const userResult = await query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        const user = userResult.rows[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const tokenExpiry = rememberMe ? '30d' : process.env.JWT_EXPIRES_IN;
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: tokenExpiry }
        );

        // Set HTTP-only cookie
        const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: cookieMaxAge
        });

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                schoolName: user.school_name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed. Please try again.'
        });
    }
});

// Logout endpoint
router.post('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
    try {
        const token = req.cookies.auth_token;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No authentication token found'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get fresh user data
        const userResult = await query(
            'SELECT id, name, email, role, school_name FROM users WHERE id = $1',
            [decoded.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = userResult.rows[0];

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                schoolName: user.school_name
            }
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid authentication token'
        });
    }
});

// Development endpoint to get latest OTP (only in development)
router.get('/dev-otp/:email', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ error: 'Not found' });
    }
    
    try {
        const { email } = req.params;
        const otpResult = await query(
            'SELECT otp, expires_at FROM otp_storage WHERE email = $1 ORDER BY created_at DESC LIMIT 1',
            [email]
        );
        
        if (otpResult.rows.length === 0) {
            return res.json({ success: false, error: 'No OTP found for this email' });
        }
        
        const otpData = otpResult.rows[0];
        const isExpired = new Date() > new Date(otpData.expires_at);
        
        res.json({
            success: true,
            otp: otpData.otp,
            expired: isExpired,
            expiresAt: otpData.expires_at
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get OTP' });
    }
});

// Google OAuth endpoint
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;
        
        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(500).json({
                success: false,
                error: 'Google OAuth not configured'
            });
        }
        
        // Verify Google JWT token
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        
        // Check if user exists
        let userResult = await query(
            'SELECT * FROM users WHERE email = $1',
            [payload.email]
        );
        
        let user;
        if (userResult.rows.length === 0) {
            // Create new user
            const newUser = await query(
                `INSERT INTO users (name, email, role, school_name) 
                 VALUES ($1, $2, $3, $4) 
                 RETURNING id, name, email, role, school_name`,
                [payload.name, payload.email, 'student', null]
            );
            user = newUser.rows[0];
            
            // Initialize user progress for all subjects and chapters
            const subjects = ['science', 'social-science'];
            const chapters = {
                'science': ['light', 'carbon-compounds', 'life-processes', 'heredity', 'natural-resources'],
                'social-science': ['nationalism', 'forest-society', 'water-resources', 'agriculture', 'democracy']
            };

            for (const subject of subjects) {
                for (const chapter of chapters[subject]) {
                    await query(
                        `INSERT INTO user_progress (user_id, subject, chapter, current_level, completed_levels, best_scores, attempts)
                         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [user.id, subject, chapter, 'foundation', '{}', '{}', '{}']
                    );
                }
            }
            
            // Send welcome email (non-blocking)
            const { sendWelcomeEmail } = require('../config/email');
            sendWelcomeEmail(payload.email, payload.name).catch(console.error);
        } else {
            user = userResult.rows[0];
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Set HTTP-only cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            success: true,
            message: 'Google authentication successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                schoolName: user.school_name
            }
        });

    } catch (error) {
        console.error('Google OAuth error:', error);
        res.status(500).json({
            success: false,
            error: 'Google authentication failed'
        });
    }
});

module.exports = router;