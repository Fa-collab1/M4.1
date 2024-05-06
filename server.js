const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, initDb } = require('./db'); // Importera både pool och initDb
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json()); // Middleware för att tolka JSON

initDb(); // Initiera databasen

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Endpoint för att registrera nya användare:
app.post('/register', async (req, res) => {
  const { firstname, lastname, email, username, password } = req.body;
  try {
    // Hasha lösenordet
    const hashedPassword = await bcrypt.hash(password, 10);

    // Lägg till en ny användare i databasen
    const result = await pool.query(
      'INSERT INTO users (firstname, lastname, email, username, password) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [firstname, lastname, email, username, hashedPassword]
    );

    if (result.rows.length > 0) {
      // Uppdatera den senaste inloggningstiden för den nya användaren
      await pool.query('UPDATE users SET latest_login = CURRENT_TIMESTAMP WHERE id = $1', [result.rows[0].id]);

      // Generera JWT-token för autentisering
      const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(500).json({ error: "Error registering user. Please try again." });
    }
  } catch (error) {
    console.error("Error while registering user:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint för att logga in användare och generera JWT:
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (rows.length > 0) {
      // Kontrollerar om det angivna lösenordet matchar det krypterade lösenordet i databasen.
      const validPassword = await bcrypt.compare(password, rows[0].password);
      if (!validPassword) return res.status(400).json({ error: 'Invalid Password' });

      // Updaterar senaste logintid för användaren
      await pool.query('UPDATE users SET latest_login = CURRENT_TIMESTAMP WHERE id = $1', [rows[0].id]);

      const token = jwt.sign({ id: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware-funktion för att validera JWT:
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Endpoint som nyttjar JWT middleware för att skydda åtkomsten:
app.get('/protected', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, company_name, job_title, start_date, end_date, description FROM workexperience');
    res.json(rows);
  } catch (error) {
    console.error("Error fetching work experience data:", error);
    res.status(500).json({ error: "An error occurred while fetching work experience data" });
  }
});
