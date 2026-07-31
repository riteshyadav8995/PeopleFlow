import { User } from '@prisma/client';

export type UserResponse = Omit<User, 'passwordHash' | 'tenantId' | 'emailVerifiedAt'> & {
  roles: string[];
};
