import http from 'http';
import app from './app.js';
import connectDB, { disconnectDB } from './config/db.js';
import connectRedis, { disconnectRedis } from './config/redis.js';
import logger from './config/logger.js';
import { backfillDefaultBeneficiary } from './services/default-beneficiary.service.js';


const PORT = process.env.PORT || 4000;

/**
 * Bootstrap the NexBank API server.
 */
const startServer = async () => {
  try {
    await connectDB();
    const beneficiaryBackfill = await backfillDefaultBeneficiary();
    logger.info(`Default beneficiary backfill completed: ${beneficiaryBackfill.added} added`);
    await connectRedis();

    const server = http.createServer(app);

    server.listen(PORT, () => {
      logger.info(`NexBank API server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    /**
     * Graceful shutdown on SIGTERM / SIGINT.
     */
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectRedis();
        await disconnectDB();
        logger.info('Server shut down complete');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
