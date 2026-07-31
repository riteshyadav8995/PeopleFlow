import { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/errors/app.error';
import { ApiResponse } from '../core/responses/api-response';
import { logger } from '../shared/logger/logger';
import { StatusCodes } from 'http-status-codes';

/**
 * Global error handler — catches all errors thrown by route handlers
 * and serialises them into the standard API response envelope.
 */
export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = (req as any).requestId;

  // Known operational errors
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message}`, {
      requestId,
      code: err.code,
      statusCode: err.statusCode,
    });

    ApiResponse.error(
      res,
      err.statusCode,
      err.message,
      err.code,
      err.details,
      requestId,
    );
    return;
  }

  // Prisma Errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      const target = prismaErr.meta?.target;
      ApiResponse.error(
        res,
        StatusCodes.CONFLICT,
        `A record with this ${target ? target : 'value'} already exists.`,
        'CONFLICT_ERROR',
        undefined,
        requestId,
      );
      return;
    }
  }

  // Unknown / programmer errors
  logger.error(`Unhandled error: ${err.message}`, {
    requestId,
    stack: err.stack,
  });

  ApiResponse.error(
    res,
    StatusCodes.INTERNAL_SERVER_ERROR,
    'An unexpected error occurred',
    'INTERNAL_ERROR',
    undefined,
    requestId,
  );
}
