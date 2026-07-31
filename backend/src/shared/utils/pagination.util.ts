import { PAGINATION } from '../../core/constants/pagination.constant';

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const paginationUtil = {
  parse(query: Record<string, unknown>, defaultSort: string = 'createdAt'): ParsedPagination {
    const page = Math.max(Number(query.page) || PAGINATION.DEFAULT_PAGE, 1);
    const limit = Math.min(
      Math.max(Number(query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MIN_LIMIT),
      PAGINATION.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;
    const sortBy = (query.sortBy as string) || defaultSort;
    const sortOrder = (query.sortOrder as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';

    return { page, limit, skip, sortBy, sortOrder };
  },
};
