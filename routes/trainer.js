const express = require("express");
const db = require("../models/db");

const router = express.Router();

// Fetch all departments
router.get("/departments", (req, res) => {
  db.query("SELECT DISTINCT name FROM departments", (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch departments." });
    res.json(results);
  });
});

// Fetch classes by department
router.get("/classes", (req, res) => {
  const { department } = req.query;
  db.query("SELECT * FROM classes WHERE department = ?", [department], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch classes." });
    res.json(results);
  });
});

// Fetch units by trainer and class
router.get("/units", (req, res) => {
  const { trainer, class: className } = req.query;
  db.query(
    "SELECT * FROM units WHERE trainer = ? AND class = ?",
    [trainer, className],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Failed to fetch units." });
      res.json(results);
    }
  );
});

// Fetch students by class
router.get("/students", (req, res) => {
  const { class: className } = req.query;
  db.query("SELECT * FROM users WHERE extra_fields->'$.class' = ?", [className], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch students." });
    res.json(results);
  });
});

// Save attendance
router.post("/attendance", (req, res) => {
  const attendanceRecords = req.body;

  const values = attendanceRecords.map((record) => [
    record.regNo,
    record.unitCode,
    record.date,
    record.status,
  ]);

  db.query(
    "INSERT INTO attendance (regNo, unitCode, date, status) VALUES ?",
    [values],
    (err) => {
      if (err) return res.status(500).json({ error: "Failed to save attendance." });
      res.json({ message: "Attendance saved successfully." });
    }
  );
});

// Register user (Trainer/HOD validation added)
router.post("/register", (req, res) => {
  const { role, idNumber, name } = req.body;

  // Validate ID Number for Trainer and HOD roles
  if ((role === "Trainer" || role === "HOD") && !idNumber) {
    return res.status(400).json({ error: "ID Number is required for Trainer/HOD." });
  }

  // Insert the user into the database
  const sql = "INSERT INTO users (role, idNumber, name) VALUES (?, ?, ?)";
  db.query(sql, [role, idNumber, name], (err) => {
    if (err) {
      console.error("Error saving user:", err);
      return res.status(500).json({ error: "Failed to register user." });
    }
    res.status(200).json({ message: "User registered successfully." });
  });
});

module.exports = router;
