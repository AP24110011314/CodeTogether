import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.js';
import authRouter from './routes/auth.js';
import roomsRouter from './routes/rooms.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check endpoints
const healthCheck = (req, res) => {
  res.status(200).json({ status: 'ok' });
};

app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// API routes
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

app.use(errorHandler);

export default app;

