import { env } from './env.validation';

export const appConfig = {
  name: 'PeopleFlow',
  version: '1.0.0',
  env: env.NODE_ENV,
  port: env.PORT,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  apiPrefix: '/api',
  apiVersion: 'v1',
};
