// ──────────────────────────────────────────────
// PeopleFlow — HTTP Server Entry Point
// ──────────────────────────────────────────────

import app from './app';
import { appConfig } from './config';
import { connectDatabase, disconnectDatabase } from './core/base/base.model';
import { logger } from './shared/logger/logger';
import { setupExotelWebSocket } from './modules/voice-agent/exotel.stream';

const PORT = appConfig.port;

async function bootstrap(): Promise<void> {
  try {
    // 1. Connect to database
    await connectDatabase();

    // 2. Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 ${appConfig.name} server running on port ${PORT}`, {
        environment: appConfig.env,
        port: PORT,
      });
      logger.info(`📋 Health check: http://localhost:${PORT}/health`);
      logger.info(`📡 API base:     http://localhost:${PORT}/api/v1`);
    });

    // 3. Attach WebSocket for Exotel Media Streams
    setupExotelWebSocket(server);

    // ─── Graceful Shutdown ────────────────────
    const shutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDatabase();
        logger.info('Graceful shutdown complete');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown — could not close connections in time');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // ─── Unhandled errors ─────────────────────
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Rejection', { reason: String(reason) });
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });
  } catch (error) {
    logger.error('❌ Failed to start server', {
      error: (error as Error).message,
    });
    process.exit(1);
  }
}

bootstrap();
