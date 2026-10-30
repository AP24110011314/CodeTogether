import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import logger from './utils/logger.js';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.CLIENT_URL,
    credentials: true,
  },
});

export { io, server };

async function bootstrap() {
  try {
    await connectDB();
    server.listen(env.PORT, () => {
      logger.info(`Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`Allowed client URL: ${env.CLIENT_URL}`);
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

