// api/auth/register.js
const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for all origins (or you can specify specific origins)
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Example registration route
app.post('/', (req, res) => {
  const { username, password, email } = req.body;

  // Dummy registration logic
  if (username && password && email) {
    return res.status(201).json({ message: 'Registration successful' });
  } else {
    return res.status(400).json({ message: 'Missing fields' });
  }
});

// Export the app as the handler for the serverless function
module.exports = app;