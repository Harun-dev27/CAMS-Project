const express = require('express');
const db = require('../models/db'); // Ensure correct path to your DB connection

const router = express.Router();

// Fetch classes for a specific course
router.get('/courses/classes', async (req, res) => {
    const { course } = req.query;

    if (!course) {
        return res.status(400).json({ error: "Course ID is required" });
    }

    try {
        const sql = 'SELECT * FROM classes WHERE course_id = ?';
        const [classes] = await db.query(sql, [course]);

        if (classes.length === 0) {
            return res.status(404).json({ error: "No classes found for this course." });
        }

        res.status(200).json(classes);
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({ error: "Internal server error." });
    }
});

module.exports = router;
