import { StatusCodes } from 'http-status-codes';
import { AppError } from './app.error';

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: unknown) {
    super(message, StatusCodes.BAD_REQUEST, 'BAD_REQUEST', true, details);
  }
}
