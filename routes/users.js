const express = require("express");
const db = require("../models/db");

const router = express.Router();

// Helper function to generate username for Trainer
const generateTrainerUsername = async () => {
  const sql = "SELECT COUNT(*) AS trainerCount FROM users WHERE role = 'Trainer'";
  const [result] = await db.query(sql);
  const count = result[0].trainerCount + 1;
  return `T${String(count).padStart(3, "0")}`; // Format: T001, T002, etc.
};

// Helper function to generate username for HOD
const generateHODUsername = async () => {
  const sql = "SELECT COUNT(*) AS hodCount FROM users WHERE role = 'HOD'";
  const [result] = await db.query(sql);
  const count = result[0].hodCount + 1;
  return `HOD${String(count).padStart(3, "0")}`; // Format: HOD001, HOD002, etc.
};


// Validate role-specific fields before user creation
function validateRoleFields(role, fields) {
  const { registrationNumber, departmentId, courseId, classId, id_number} = fields || {};

  if (role === "Student" || role === "ClassRep") {
    if (!registrationNumber) throw new Error("Registration number is required.");
    if (!departmentId) throw new Error("Department ID is required.");
    if (!courseId) throw new Error("Course ID is required.");
    if (!classId) throw new Error("Class ID is required.");
  } else if (role === "Trainer" || role === "HOD") {
    if (!id_number) {
      throw new Error("ID Number is required for Trainer/HOD.");
    }
    const idNumberPattern = /^\d{8}$/; // Example: 8-digit numeric ID
    if (!idNumberPattern.test(id_number)) {
      throw new Error("Invalid ID Number format. Must be an 8-digit number.");
    }
  }
}

// Validate department and course IDs
async function validateForeignKeys(departmentId, courseId, classId) {
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
  if (classId) {
    const classCheckSql = "SELECT id FROM classes WHERE id = ?";
    const [classResult] = await db.query(classCheckSql, [classId]);
    if (!classResult.length) throw new Error("Invalid class ID.");
  }
  
}

// Check if registration number is unique
async function isUniqueRegistrationNumber(registrationNumber) {
  const sql = "SELECT COUNT(*) AS count FROM users WHERE registration_number = ?";
  const [result] = await db.query(sql, [registrationNumber]);
  return result[0].count === 0;
}

// Enhanced user creation handler
router.post("/", async (req, res) => {
  const { name, password, role, id_number } = req.body;

  try {
    // Log the incoming payload for debugging
    console.log("Payload received by the server:", JSON.stringify(req.body, null, 2));

    // Validate fields
    if (!role || !name || !password) {
      return res.status(400).json({ error: "Role, name, and password are required." });
    }

    // Enforce password rules
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password) ||
      !/[!@#$%^&*]/.test(password)
    ) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long, include one uppercase letter, one number, and one special character (!@#$%^&*).",
      });
    }

    // Modify how extraFields is extracted
    const flattenedFields = {
      registrationNumber: req.body.registrationNumber,
      departmentId: req.body.departmentId,
      courseId: req.body.courseId,
      classId: req.body.classId,
      id_number: req.body.id_number,
    };

    validateRoleFields(role, flattenedFields);

    // Validate foreign keys
    await validateForeignKeys(flattenedFields.departmentId, flattenedFields.courseId);

    // Check registration number uniqueness
    if (
      (role === "Student" || role === "ClassRep") &&
      !(await isUniqueRegistrationNumber(flattenedFields.registrationNumber))
    ) {
      throw new Error("Registration number already exists.");
    }

    // Generate username
    const username = await generateUsername(role, id_number, flattenedFields);
    if (!username) return;

    // Insert user into the database
    await insertUser(name, username, password, role, id_number, flattenedFields, res);
  } catch (error) {
    console.error("Error processing user creation:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Helper function: Validate role
function isValidRole(role) {
  return ["Trainer", "HOD", "Student", "ClassRep"].includes(role);
}

// Helper function: Generate username
async function generateUsername(role, id_number, fields) {
  if (role === "Trainer" || role === "HOD") {
    return await handleTrainerOrHOD(role, id_number);
  }
  if (role === "Student" || role === "ClassRep") {
    return await handleStudentOrClassRep(role, fields);
  }
  return null;
}

// Helper function: Handle Trainer or HOD
async function handleTrainerOrHOD(role, id_number) {
  if (!id_number) {
    throw new Error("ID Number is required for Trainer or HOD.");
  }

  if (!(await isUniqueIDNumber(id_number))) {
    throw new Error("ID Number already exists.");
  }

  return role === "Trainer" ? await generateTrainerUsername() : await generateHODUsername();
}

// Helper function: Handle Student or ClassRep
async function handleStudentOrClassRep(role, fields) {
  const { registrationNumber, departmentId, courseId, classId } = fields || {};

  if (!registrationNumber || !departmentId || !courseId || !classId) {
    throw new Error(
      "All fields (registrationNumber, departmentId, courseId, classId) are required."
    );
  }

  return role === "ClassRep"
    ? await generateClassRepUsername(registrationNumber)
    : registrationNumber;
}

//Helper function to generate username for ClassRep
const generateClassRepUsername = async (registrationNumber) => {
  if (!registrationNumber) throw new Error("Registration number is missing.");

  const sql = "SELECT COUNT(*) AS classRepCount FROM users WHERE role = 'ClassRep' AND registration_number = ?";
  const [result] = await db.query(sql, [registrationNumber]);

  if (!result || result.length === 0) {
    throw new Error("Database error: Unable to fetch ClassRep count.");
  }

  const count = result[0].classRepCount + 1;

  if (count > 2) {
    throw new Error("Each class can only have two ClassReps.");
  }

  return `${registrationNumber}/C-${count}`; // Format: DIT/2209/C-1, DIT/2209/C-2
};

// Helper function: Check if ID number is unique
async function isUniqueIDNumber(id_number) {
  const sql = "SELECT COUNT(*) AS count FROM users WHERE id_number = ?";
  const [result] = await db.query(sql, [id_number]);
  return result[0].count === 0;
}

// Helper function: Insert user into the database
async function insertUser(name, username, password, role, id_number, fields, res) {
  const sql = `
    INSERT INTO users (name, username, password, role, id_number, department_id, course_id, class_id, registration_number, extra_fields)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    name,
    username,
    password,
    role,
    id_number || null,
    fields.departmentId || null,
    fields.courseId || null,
    fields.classId || null,
    fields.registrationNumber || null,
    JSON.stringify(fields || {}),
  ];

  try {
    const [result] = await db.query(sql, values);
    res.status(201).json({
      message: "User added successfully.",
      username,
      id: result.insertId,
    });
  } catch (err) {
    console.error("Error adding user:", err.message);
    res.status(500).json({ error: "Failed to add user.", details: err.message });
  }
}

// GET route for fetching all users**
router.get("/", async (req, res) => {
  try {
    const sql = "SELECT * FROM users";
    const [results] = await db.query(sql);
    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ error: "Failed to fetch users.", details: err.message });
  }
});

// DELETE route for deleting a user
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Validate that ID is provided
    if (!id) {
      return res.status(400).json({ error: "User ID is required." });
    }

    // Delete user from the database
    const sql = "DELETE FROM users WHERE id = ?";
    const [result] = await db.query(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({ message: "User deleted successfully." });
  } catch (err) {
    console.error("Error deleting user:", err.message);
    res.status(500).json({ error: "Failed to delete user.", details: err.message });
  }
});



module.exports = router;
