const express = require("express");
const db = require("../models/db");
const router = express.Router();

// Fetch all departments
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM departments");
    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching departments:", err.message);
    res.status(500).json({ error: "Failed to fetch departments." });
  }
});

// Add a new department
router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required." });
  }
  try {
    const sql = "INSERT INTO departments (name) VALUES (?)";
    const [result] = await db.query(sql, [name]);
    res.status(201).json({ message: `${name} added successfully.`, id: result.insertId });
  } catch (err) {
    console.error("Error adding department:", err.message);
    res.status(500).json({ error: "Failed to add department." });
  }
});

// Fetch courses for a specific department
router.get("/courses", async (req, res) => {
  const { department } = req.query;

  if (!department) {
    return res.status(400).json({ error: "Department ID is required." });
  }

  try {
    const sql = "SELECT id, name FROM courses WHERE department_id = ?";
    const [results] = await db.query(sql, [department]);
    res.status(200).json(results || []);
  } catch (err) {
    console.error("Error fetching courses:", err.message);
    res.status(500).json({ error: "Failed to fetch courses." });
  }
});

// Add a new course
router.post("/courses", async (req, res) => {
  const { name, department_id } = req.body;
  if (!name || !department_id) {
    return res.status(400).json({ error: "Name and department_id are required." });
  }
  try {
    const deptCheckSql = "SELECT * FROM departments WHERE id = ?";
    const [dept] = await db.query(deptCheckSql, [department_id]);
    if (!dept.length) {
      return res.status(400).json({ error: "Invalid department ID." });
    }

    const sql = "INSERT INTO courses (name, department_id) VALUES (?, ?)";
    const [result] = await db.query(sql, [name, department_id]);
    res.status(201).json({ message: `${name} added successfully.`, id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Course name already exists." });
    }
    console.error("Error adding course:", err.message);
    res.status(500).json({ error: "Failed to add course." });
  }
});


// Add a new class
router.post("/classes", async (req, res) => {
  const { name, departmentId, courseId } = req.body;
  if (!name || !departmentId || !courseId) {
    return res.status(400).json({ error: "Name, departmentId, and courseId are required." });
  }
  try {
    // Validate department and course IDs
    await validateForeignKeys(departmentId, courseId);

    const sql = "INSERT INTO classes (name, department_id, course_id) VALUES (?, ?, ?)";
    const [result] = await db.query(sql, [name, departmentId, courseId]);
    res.status(201).json({ message: `${name} added successfully.`, id: result.insertId });
  } catch (err) {
    console.error("Error adding class:", err.message);
    res.status(500).json({ error: "Failed to add class." });
  }
});

// Add a new unit
router.post("/units", async (req, res) => {
  const { name, code, departmentId, courseId } = req.body;
  if (!name || !code || !departmentId || !courseId) {
    return res.status(400).json({ error: "Name, code, departmentId, and courseId are required." });
  }
  try {
    // Validate department and course IDs
    await validateForeignKeys(departmentId, courseId);

    const sql = "INSERT INTO units (name, code, department_id, course_id) VALUES (?, ?, ?, ?)";
    const [result] = await db.query(sql, [name, code, departmentId, courseId]);
    res.status(201).json({ message: `${name} added successfully.`, id: result.insertId });
  } catch (err) {
    console.error("Error adding unit:", err.message);
    res.status(500).json({ error: "Failed to add unit." });
  }
});

// Fetch all classes for a specific course (by query)
router.get("/courses/classes", async (req, res) => {
  const { course } = req.query;

  if (!course) {
    return res.status(400).json({ error: "Course ID is required." });
  }

  try {
    const sql = `
      SELECT cl.id, cl.name, d.name AS department
      FROM classes cl
      JOIN departments d ON cl.department_id = d.id
      WHERE cl.course_id = ?
    `;
    const [results] = await db.query(sql, [course]);
    res.status(200).json(results || []);
  } catch (err) {
    console.error("Error fetching classes for course:", err.message);
    res.status(500).json({ error: "Failed to fetch classes for course." });
  }
});

// Fetch all units for a specific course
router.get("/courses/units", async (req, res) => {
  const { course } = req.query;

  if (!course) {
    return res.status(400).json({ error: "Course ID is required." });
  }

  try {
    const sql = `
      SELECT u.id, u.name, u.code, d.name AS department
      FROM units u
      JOIN departments d ON u.department_id = d.id
      WHERE u.course_id = ?
    `;
    const [results] = await db.query(sql, [course]);
    res.status(200).json(results || []);
  } catch (err) {
    console.error("Error fetching units for course:", err.message);
    res.status(500).json({ error: "Failed to fetch units for course." });
  }
});

// Helper function: Validate department and course IDs
async function validateForeignKeys(departmentId, courseId) {
  if (departmentId) {
    const deptCheckSql = "SELECT id FROM departments WHERE id = ?";
    const [dept] = await db.query(deptCheckSql, [departmentId]);
    if (!dept.length) throw new Error("Invalid department ID.");
  }
  if (courseId) {
    const courseCheckSql = "SELECT id FROM courses WHERE id = ?";
    const [course] = await db.query(courseCheckSql, [courseId]);
    if (!course.length) throw new Error("Invalid course ID.");
  }
}

module.exports = router;
