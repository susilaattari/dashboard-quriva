import useSWR from 'swr';
import api from '@/services/api';

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
  counts?: Record<string, number>;
}

async function fetchPaginated<T>(url: string, params: Record<string, unknown>): Promise<PaginatedResult<T>> {
  const res = await api.get(url, { params: { ...params, paginated: true } });
  return {
    items: res.data?.data || [],
    pagination:
      res.data?.meta?.pagination || {
        page: Number(params.page) || 1,
        per_page: Number(params.per_page) || 10,
        total: res.data?.data?.length || 0,
        total_pages: 1,
      },
    counts: res.data?.meta?.counts,
  };
}

export function usePaginatedList<T>(url: string, params: Record<string, unknown>) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<PaginatedResult<T>>(
    [url, params],
    ([keyUrl, keyParams]) => fetchPaginated<T>(keyUrl as string, keyParams as Record<string, unknown>),
    { keepPreviousData: true, revalidateOnFocus: false }
  );

  return {
    items: data?.items || [],
    pagination: data?.pagination,
    counts: data?.counts,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}
