import { app } from './app.js';
import { config } from './config/environment.js';
import { logger } from './utils/logger.js';
import { isSupabaseEnabled } from './config/supabase.js';

const server = app.listen(config.port, () => {
  logger.info(`=======================================================`);
  logger.info(` Phantom Classrooms Backend Server is running!`);
  logger.info(` Environment: ${config.nodeEnv}`);
  logger.info(` Listening on: http://localhost:${config.port}`);
  logger.info(` Storage Mode: ${isSupabaseEnabled() ? 'Supabase PostgreSQL (Live)' : 'In-Memory (Demo Mode)'}`);
  logger.info(` Campus Timezone: ${config.campusTimezone}`);
  logger.info(` Electricity Tariff: ₹${config.tariffInrPerKwh}/kWh`);
  logger.info(` Health check: http://localhost:${config.port}/api/health`);
  logger.info(`=======================================================`);
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force exit after 5 seconds if connections hang
  setTimeout(() => {
    logger.error('Forced termination due to timeout during shutdown.');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
