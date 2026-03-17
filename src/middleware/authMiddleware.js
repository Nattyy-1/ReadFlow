import jwt from 'jsonwebtoken';

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "No token provided or invalid format" });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET || 'this-is-a-fail-safe', (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });

    req.user = {
      id: decoded.id,
      username: decoded.username
    };
    next();
  });
}

export default authMiddleware;
