import express from 'express';
import authRoutes from './routes/authRoutes.js';
import authMiddleware from './middleware/authMiddleware.js';
import bookRoutes from './routes/bookRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/books', authMiddleware, bookRoutes);
app.use('/api/sessions', authMiddleware, sessionRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});
