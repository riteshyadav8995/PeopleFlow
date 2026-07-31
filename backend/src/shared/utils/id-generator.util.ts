import { v4 as uuidv4 } from 'uuid';

export const idGenerator = {
  uuid(): string {
    return uuidv4();
  },

  /**
   * Generate a sequential employee code like EMP-00001
   */
  employeeCode(sequence: number, prefix: string = 'EMP'): string {
    return `${prefix}-${String(sequence).padStart(5, '0')}`;
  },

  /**
   * Generate a request/transaction reference
   */
  reference(prefix: string = 'REF'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  },
};
