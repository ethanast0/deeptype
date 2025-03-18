import loguru from 'loguru';

// Configure logger
const logger = loguru({
  colorize: true,
  timestamp: true,
  level: process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG',
});

export { logger }; 