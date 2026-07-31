import { StatusCodes } from 'http-status-codes';
import { AppError } from './app.error';
import { ZodError } from 'zod';

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(zodError: ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of zodError.issues) {
      const path = issue.path.join('.') || '_root';
      if (!errors[path]) errors[path] = [];
      errors[path].push(issue.message);
    }

    super('Validation failed', StatusCodes.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', true, errors);
    this.errors = errors;
  }
}
