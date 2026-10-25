'use client';

import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';
import { errorMessage } from './api';

export interface Resource<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
}

/**
 * Loads data on mount and whenever `deps` change. Responses that arrive
 * after a newer request started are dropped, so fast filter changes never
 * show stale rows.
 */
export function useResource<T>(loader: () => Promise<T>, deps: DependencyList): Resource<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);
  const requestRef = useRef(0);
  loaderRef.current = loader;

  const reload = useCallback(async () => {
    const request = ++requestRef.current;
    setLoading(true);
    try {
      const next = await loaderRef.current();
      if (request !== requestRef.current) return;
      setData(next);
      setError(null);
    } catch (e) {
      if (request !== requestRef.current) return;
      setError(errorMessage(e));
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    // The caller's dependency list decides when to refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, reload };
}
