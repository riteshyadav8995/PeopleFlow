import { Express } from 'express';
import healthRoutes from './health.routes';
import v1Routes from './v1.routes';
import publicRoutes from './public.routes';
import webhookRoutes from './webhook.routes';

/**
 * Register all application routes.
 */
export function registerRoutes(app: Express): void {
  // Health check (no prefix)
  app.use('/health', healthRoutes);

  // API v1
  app.use('/api/v1', v1Routes);

  // Public routes (no auth)
  app.use('/api/public', publicRoutes);

  // Webhooks
  app.use('/api/webhooks', webhookRoutes);
}
