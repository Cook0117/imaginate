const express = require('express');
const router = express.Router();

// Example login route
router.post('/', (req, res) => {
  const { username, password } = req.body;

  // Dummy login validation
  if (username === 'admin' && password === 'password') {
    return res.status(200).json({ message: 'Login successful' });
  } else {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
});

module.exports = router;