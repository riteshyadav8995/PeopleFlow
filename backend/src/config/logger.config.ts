import { env } from './env.validation';

export const loggerConfig = {
  level: env.LOG_LEVEL,
  format: env.NODE_ENV === 'production' ? 'json' : 'pretty',
};
