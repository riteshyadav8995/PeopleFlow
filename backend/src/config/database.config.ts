import { env } from './env.validation';

export const databaseConfig = {
  url: env.DATABASE_URL,
  logging: env.NODE_ENV === 'development',
};
