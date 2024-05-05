const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, initDb } = require('./db'); // Importera både pool och initDb

const app = express();

app.use(express.json()); // Middleware för att tolka JSON

initDb(); // Initiera databasen

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Endpoint för att registrera nya användare:
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  //console.log(req.body); // Logga för att se vad som tas emot för test

  // Kontrollera om lösenord eller användarnamn saknas
  if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
  }

  // Kontrollera om användare redan finns
  const userExists = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
  }

  // Kontrollera om password är minst 6 tecken långt
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long" });
  }




  try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
          'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
          [username, hashedPassword]
      );
      res.status(201).json(result.rows[0]);
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

// Endpoint som använder JWT-middleware för att skydda åtkomsten:
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: "Welcome to the protected route, authorized user!" });
});


