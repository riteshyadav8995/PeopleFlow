import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS } from '../../core/constants/application.constant';

export const passwordUtil = {
  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
  },

  async compare(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  },
};
