export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginationResult<T> {
  items: T[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}
