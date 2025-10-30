const mysql = require("mysql2/promise"); // Use mysql2 with promise support

// Create a connection pool to the database
const db = mysql.createPool({
  host: "localhost", // Database host (default: localhost)
  user: "root", // Your MySQL username
  password: "", // Your MySQL password
  database: "cams_db", // Database name
});

// Test the connection when the application starts
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("Connected to the MySQL database.");
    connection.release(); // Release the connection back to the pool
  } catch (err) {
    console.error("Error connecting to the database:", err.message);
    process.exit(1); // Exit the process if unable to connect
  }
})();

// Export the database pool for use in other parts of the application
module.exports = db;
