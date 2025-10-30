const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

// Import routes
const userRoutes = require("./routes/users"); // User management routes
const authRoutes = require("./routes/auth"); // Authentication routes
const trainerRoutes = require("./routes/trainer"); // Trainer routes
const hodRoutes = require("./routes/hod"); // HOD routes
const departmentRoutes = require("./routes/departments"); // Department routes
const coursesRoutes = require('./routes/courses'); // Adjust the path

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors()); // Enable CORS for all origins

// Route for the root path
app.get("/", (req, res) => {
  res.send("Welcome to the homepage!");
});

// Routes
app.use("/api/users", userRoutes); // User management routes
app.use("/api/auth", authRoutes); // Authentication routes
app.use("/api/trainer", trainerRoutes); // Trainer routes
app.use("/api/hod", hodRoutes); // HOD routes
app.use("/api/departments", departmentRoutes); // Department routes
app.use('/api', coursesRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
