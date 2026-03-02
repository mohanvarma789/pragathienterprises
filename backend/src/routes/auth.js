const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query(
            'SELECT id, username, password, name, email, role, active FROM users WHERE username = ?',
            [username]
        );

        if (rows.length > 0) {
            const user = rows[0];

            // Verify password (bcrypt)
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            if (!user.active) {
                return res.status(403).json({ error: 'Account is inactive' });
            }

            // Create JWT
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Log the login
            try {
                await pool.query(
                    'INSERT INTO login_logs (userId, username, ipAddress, userAgent) VALUES (?, ?, ?, ?)',
                    [user.id, user.username, req.ip, req.headers['user-agent']]
                );
            } catch (logErr) {
                console.error('Error logging login:', logErr);
            }

            // Return user and token (exclude password)
            const { password: _, ...userWithoutPassword } = user;
            res.json({ user: userWithoutPassword, token });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error during login' });
    }
});

module.exports = router;
