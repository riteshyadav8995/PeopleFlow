// ──────────────────────────────────────────────
// PeopleFlow — Custom Error Hierarchy
// ──────────────────────────────────────────────

import { StatusCodes } from 'http-status-codes';

/**
 * Base application error that every custom error extends.
 * Carries an HTTP status code so the error middleware can
 * serialise it into a consistent API response.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: unknown,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
