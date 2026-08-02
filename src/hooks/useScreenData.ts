import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

interface Result<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

export function useScreenData<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
): Result<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const runIdRef = useRef(0);

  const run = useCallback(async () => {
    const runId = ++runIdRef.current;
    setError(false);
    try {
      const result = await loaderRef.current();
      if (runIdRef.current !== runId) return;
      setData(result);
    } catch {
      if (runIdRef.current === runId) setError(true);
    } finally {
      if (runIdRef.current === runId) setLoading(false);
    }
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    await run();
  }, [run]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await run();
    setRefreshing(false);
  }, [run]);

  useFocusEffect(
    useCallback(() => {
      reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps),
  );

  return { data, loading, error, refreshing, refresh, reload, setData };
}
