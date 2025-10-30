const db = require('./models/db');

// Test connection
db.query('SELECT 1 + 1 AS result', (err, results) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Database connected successfully:', results);
  }
});
