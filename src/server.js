import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import errorHandler from './middleware/errorMiddleware.js';
import bookRoutes from './routes/bookRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import { apiLimiter } from './middleware/rateLimiter.js';

export const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(helmet());
app.use(express.json());

app.use('/api', apiLimiter);
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

export const startServer = (port = process.env.PORT || 5000) => {
  const server = app.listen(port);

  server.once('listening', () => {
    const address = server.address();
    const resolvedPort = typeof address === 'object' && address ? address.port : port;
    console.log(`Server listening on port: ${resolvedPort}`);
  });

  return server;
};

if (import.meta.main) {
  startServer();
}
