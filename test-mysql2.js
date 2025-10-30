const mysql = require('mysql2/promise');

(async () => {
    try {
        const db = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: 'DIT220906G',
            database: 'cams_db',
        });

        const [rows] = await db.query('SELECT 1 + 1 AS solution');
        console.log('Query result:', rows[0].solution); // Should print: 2
    } catch (err) {
        console.error('Error:', err.message);
    }
})();
