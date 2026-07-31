import { Response } from 'express';
import { ApiResponse } from './api-response';

// ──────────────────────────────────────────────
// Cursor-based & offset-based pagination
// ──────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export class PaginationResponse {
  static send<T>(res: Response, result: PaginatedResult<T>, message: string = 'Success'): Response {
    return ApiResponse.success(res, result.items, message, {
      pagination: result.meta,
    });
  }

  static buildMeta(page: number, limit: number, totalItems: number): PaginationMeta {
    const totalPages = Math.ceil(totalItems / limit);
    return {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
