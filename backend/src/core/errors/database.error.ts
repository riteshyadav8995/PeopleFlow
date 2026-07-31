import { StatusCodes } from 'http-status-codes';
import { AppError } from './app.error';

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: unknown) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR, 'DATABASE_ERROR', true, details);
  }
}
