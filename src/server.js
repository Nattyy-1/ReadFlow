import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import errorHandler from './middleware/errorMiddleware.js';
import bookRoutes from './routes/bookRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(helmet());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/books', authMiddleware, bookRoutes);
app.use('/api/sessions', authMiddleware, sessionRoutes);
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.originalUrl}`
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});
