import { useState, useCallback } from 'react';

export interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
}

export default function usePagination(options: UsePaginationOptions = {}) {
  const { initialPage = 0, pageSize = 20 } = options;
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);

  const nextPage = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(0, p - 1));
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setHasMore(true);
  }, [initialPage]);

  const offset = page * pageSize;

  return {
    page,
    pageSize,
    offset,
    hasMore,
    setHasMore,
    nextPage,
    prevPage,
    reset,
  };
}
