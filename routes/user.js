const express = require('express');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const router = express.Router();

// Middleware to verify authentication
const authenticateUser = async (req, res, next) => {
    try {
        const token = req.cookies.auth_token;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid authentication token'
        });
    }
};

// Get user progress
router.get('/progress', authenticateUser, async (req, res) => {
    try {
        const progressResult = await query(
            `SELECT subject, chapter, current_level, completed_levels, best_scores, attempts 
             FROM user_progress WHERE user_id = $1`,
            [req.user.id]
        );

        const progress = {};
        progressResult.rows.forEach(row => {
            if (!progress[row.subject]) {
                progress[row.subject] = {};
            }
            progress[row.subject][row.chapter] = {
                currentLevel: row.current_level,
                completedLevels: row.completed_levels || [],
                bestScores: row.best_scores || {},
                attempts: row.attempts || {}
            };
        });

        res.json({
            success: true,
            progress
        });

    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch progress'
        });
    }
});

// Update user progress
router.post('/progress', authenticateUser, async (req, res) => {
    try {
        const { subject, chapter, level, score, passed, timeElapsed, answers } = req.body;

        if (!subject || !chapter || !level || score === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Subject, chapter, level, and score are required'
            });
        }

        // Get current progress
        const currentProgress = await query(
            `SELECT * FROM user_progress WHERE user_id = $1 AND subject = $2 AND chapter = $3`,
            [req.user.id, subject, chapter]
        );

        if (currentProgress.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Progress record not found'
            });
        }

        const progress = currentProgress.rows[0];
        const completedLevels = progress.completed_levels || [];
        const bestScores = progress.best_scores || {};
        const attempts = progress.attempts || {};

        // Update attempts
        if (!attempts[level]) {
            attempts[level] = {};
        }
        const attemptId = Date.now().toString();
        attempts[level][attemptId] = {
            score,
            timestamp: Date.now(),
            passed,
            timeElapsed
        };

        // Update best score
        if (!bestScores[level] || score > bestScores[level]) {
            bestScores[level] = score;
        }

        // Update completed levels and current level
        let newCurrentLevel = progress.current_level;
        if (passed && !completedLevels.includes(level)) {
            completedLevels.push(level);
            
            // Unlock next level
            const levels = ['foundation', 'core', 'advanced', 'expert', 'master'];
            const currentIndex = levels.indexOf(level);
            if (currentIndex < levels.length - 1) {
                newCurrentLevel = levels[currentIndex + 1];
            }
        }

        // Update database
        await query(
            `UPDATE user_progress 
             SET current_level = $1, completed_levels = $2, best_scores = $3, attempts = $4, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $5 AND subject = $6 AND chapter = $7`,
            [newCurrentLevel, JSON.stringify(completedLevels), JSON.stringify(bestScores), JSON.stringify(attempts), req.user.id, subject, chapter]
        );

        // Record test attempt
        await query(
            `INSERT INTO test_attempts (user_id, subject, chapter, level, score, total_questions, time_taken, answers)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [req.user.id, subject, chapter, level, score, Object.keys(answers || {}).length, timeElapsed || 0, JSON.stringify(answers || {})]
        );

        res.json({
            success: true,
            message: 'Progress updated successfully',
            newLevel: newCurrentLevel,
            levelUnlocked: newCurrentLevel !== progress.current_level
        });

    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update progress'
        });
    }
});

// Get user profile
router.get('/profile', authenticateUser, async (req, res) => {
    try {
        const userResult = await query(
            'SELECT id, name, email, role, school_name, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = userResult.rows[0];

        // Get statistics
        const statsResult = await query(
            `SELECT 
                COUNT(*) as total_attempts,
                AVG(score) as average_score,
                MAX(score) as best_score,
                COUNT(DISTINCT subject || chapter) as chapters_attempted
             FROM test_attempts WHERE user_id = $1`,
            [req.user.id]
        );

        const stats = statsResult.rows[0];

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                schoolName: user.school_name,
                joinedAt: user.created_at
            },
            stats: {
                totalAttempts: parseInt(stats.total_attempts) || 0,
                averageScore: Math.round(parseFloat(stats.average_score) || 0),
                bestScore: parseInt(stats.best_score) || 0,
                chaptersAttempted: parseInt(stats.chapters_attempted) || 0
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile'
        });
    }
});

// Update user profile
router.put('/profile', authenticateUser, async (req, res) => {
    try {
        const { name, schoolName, role } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Name is required'
            });
        }

        await query(
            'UPDATE users SET name = $1, school_name = $2, role = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
            [name, schoolName || null, role || 'student', req.user.id]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile'
        });
    }
});

module.exports = router;