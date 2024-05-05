const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Använder DATABASE_URL från .env-filen
  ssl: {
      rejectUnauthorized: false
  },
});


// Funktion för att skapa tabeller om de inte redan finns
const initDb = async () => {
  const queries = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      account_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(queries);
    console.log('Database initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

module.exports = { pool, initDb };
