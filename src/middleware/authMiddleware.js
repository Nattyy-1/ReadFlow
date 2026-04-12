import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "No token provided or invalid format" });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });

    req.user = {
      id: decoded.id,
      username: decoded.username
    };
    next();
  });
}
