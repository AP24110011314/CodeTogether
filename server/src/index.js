import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { setupSockets } from './sockets/index.js';
import logger from './utils/logger.js';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.CLIENT_URL,
    credentials: true,
  },
  maxHttpBufferSize: 5e6, // 5 MB (allows security guard to intercept and reject oversized payloads)
});

app.set('io', io);

setupSockets(io);

export { io, server };

async function bootstrap() {
  try {
    await connectDB();
    server.listen(env.PORT, () => {
      logger.info(`Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`Allowed client URL: ${env.CLIENT_URL}`);
      if (!env.GEMINI_API_KEY) {
        logger.warn('GEMINI_API_KEY is not set in environment. AI Tutor will be disabled or return configuration errors.');
      } else {
        logger.info(`AI Tutor configured with model: ${env.GEMINI_MODEL}`);
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

// Only bootstrap directly when running as main script
if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}

function handleShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

