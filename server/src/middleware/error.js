import logger from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR');
  const message = err.message || 'An unexpected error occurred';

  if (statusCode >= 500) {
    logger.error({ err, path: req.path, method: req.method }, 'Unhandled server error');
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && err.details ? { details: err.details } : {}),
    },
  });
}
