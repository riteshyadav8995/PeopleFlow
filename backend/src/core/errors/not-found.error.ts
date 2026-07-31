import { StatusCodes } from 'http-status-codes';
import { AppError } from './app.error';

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, StatusCodes.NOT_FOUND, 'NOT_FOUND');
  }
}
