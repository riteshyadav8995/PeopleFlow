export const APPLICATION = {
  NAME: 'PeopleFlow',
  VERSION: '1.0.0',
  API_PREFIX: '/api',
  API_VERSION: 'v1',
  DEFAULT_TIMEZONE: 'UTC',
} as const;

export const BCRYPT_SALT_ROUNDS = 12;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MINUTES = 30;
