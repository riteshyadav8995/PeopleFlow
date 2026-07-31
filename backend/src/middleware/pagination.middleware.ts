import { Request, Response, NextFunction } from 'express';
import { PAGINATION } from '../core/constants/pagination.constant';

/**
 * Pagination middleware — parses page/limit/sort from query string
 * and attaches normalized values to req.pagination.
 */
export function paginationMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const page = Math.max(Number(req.query.page) || PAGINATION.DEFAULT_PAGE, 1);
  const limit = Math.min(
    Math.max(Number(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MIN_LIMIT),
    PAGINATION.MAX_LIMIT,
  );
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = (req.query.sortOrder as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';

  (req as any).pagination = {
    page,
    limit,
    skip: (page - 1) * limit,
    sortBy,
    sortOrder,
  };

  next();
}
