import { useState, useEffect, useCallback } from 'react';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useApi<T>(
  apiCall: () => Promise<{ success: boolean; data?: T; error?: string }>,
  deps: React.DependencyList = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || '获取数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误');
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

