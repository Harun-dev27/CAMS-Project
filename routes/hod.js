const express = require("express");
const db = require("../models/db");

const router = express.Router();

// Get classes under HOD's department
router.get("/classes", (req, res) => {
  const { department } = req.query;

  const sql = "SELECT name FROM classes WHERE department = ?";
  db.query(sql, [department], (err, results) => {
    if (err) {
      console.error("Error fetching classes:", err);
      return res.status(500).json({ error: "Failed to fetch classes." });
    }
    res.status(200).json(results);
  });
});

// Get attendance summary
router.get("/attendance-summary", (req, res) => {
  const { class: className, period } = req.query;

  // Example query; modify based on actual schema
  const sql = `
    SELECT s.name, 
           ROUND(SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) AS attendance
    FROM attendance a
    JOIN students s ON a.regNo = s.regNo
    WHERE s.class = ?
    GROUP BY s.name
  `;

  db.query(sql, [className], (err, results) => {
    if (err) {
      console.error("Error fetching attendance summary:", err);
      return res.status(500).json({ error: "Failed to fetch attendance summary." });
    }
    res.status(200).json(results);
  });
});

// Register HOD
router.post("/register", (req, res) => {
  const { role, idNumber, name } = req.body;

  // Validate ID Number for HOD
  if (role === "HOD" && !idNumber) {
    return res.status(400).json({ error: "ID Number is required for HOD." });
  }

  // Insert the user into the database
  const sql = "INSERT INTO users (role, idNumber, name) VALUES (?, ?, ?)";
  db.query(sql, [role, idNumber, name], (err) => {
    if (err) {
      console.error("Error saving user:", err);
      return res.status(500).json({ error: "Failed to register HOD." });
    }
    res.status(200).json({ message: "HOD registered successfully." });
  });
});

module.exports = router;
