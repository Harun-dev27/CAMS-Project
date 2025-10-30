const express = require('express');
const db = require('../models/db');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';

    try {
        // Execute the query using the promise-based API
        const [results] = await db.query(sql, [username, password]);

        // Check if user exists
        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid username or password." });
        }

        const user = results[0];
        let extraFields;

        // Safely parse extra_fields
        try {
            extraFields = JSON.parse(user.extra_fields || "{}");
        } catch (parseError) {
            console.error("Error parsing extra_fields:", parseError);
            extraFields = {}; // Fallback to an empty object
        }

        // Respond with user data
        res.status(200).json({
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            extraFields, // Parsed extra_fields
        });
    } catch (err) {
        console.error('Error during login query:', err);
        return res.status(500).json({ message: "Internal server error." });
    }
});  

module.exports = router;
