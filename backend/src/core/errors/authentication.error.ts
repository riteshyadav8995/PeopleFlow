import { StatusCodes } from 'http-status-codes';
import { AppError } from './app.error';

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, StatusCodes.UNAUTHORIZED, 'AUTHENTICATION_ERROR');
  }
}
