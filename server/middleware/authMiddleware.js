const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    console.log("Auth failed: No token");
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // adds user payload to the request
    next();
  } catch (error) {
    console.log("Auth failed: Invalid token", error.message);
    res.status(400).json({ error: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
