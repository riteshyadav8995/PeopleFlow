import { StatusCodes } from 'http-status-codes';
import { AppError } from './app.error';

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, StatusCodes.CONFLICT, 'CONFLICT');
  }
}
