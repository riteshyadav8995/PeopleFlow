import { StatusCodes } from 'http-status-codes';
import { AppError } from './app.error';

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, StatusCodes.FORBIDDEN, 'AUTHORIZATION_ERROR');
  }
}
