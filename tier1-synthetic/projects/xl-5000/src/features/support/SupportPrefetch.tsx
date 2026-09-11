import { useState, useEffect, useCallback, useRef } from 'react';
import clsx from 'clsx';
import SupportFunnel from './SupportFunnel';
import SupportErrorBoundary from './SupportErrorBoundary';
import styles from './SupportPrefetch.module.css';

interface FetchState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  isRefetching: boolean;
}

interface SupportPrefetchProps<T = unknown> {
  url?: string;
  fetchFn?: () => Promise<T>;
  children?: (state: FetchState<T>) => React.ReactNode;
  retryCount?: number;
  retryDelay?: number;
  staleTime?: number;
  placeholder?: React.ReactNode;
  errorFallback?: (error: string, retry: () => void) => React.ReactNode;
  className?: string;
}

export default function SupportPrefetch<T = unknown>({
  url,
  fetchFn,
  children: renderProp,
  retryCount = 3,
  retryDelay = 1000,
  staleTime = 30000,
  placeholder,
  errorFallback,
  className,
}: SupportPrefetchProps<T>) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    error: null,
    isLoading: true,
    isRefetching: false,
  });
  const mountedRef = useRef(true);
  const retriesRef = useRef(0);
  const lastFetchRef = useRef<number>(0);

  const executeFetch = useCallback(async (isRefetch = false) => {
    if (!mountedRef.current) return;

    setState(prev => ({
      ...prev,
      isLoading: !isRefetch,
      isRefetching: isRefetch,
      error: null,
    }));

    try {
      let data: T;
      if (fetchFn) {
        data = await fetchFn();
      } else if (url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.json() as T;
      } else {
        throw new Error('No url or fetchFn provided');
      }

      if (mountedRef.current) {
        setState({ data, error: null, isLoading: false, isRefetching: false });
        lastFetchRef.current = Date.now();
        retriesRef.current = 0;
      }
    } catch (err) {
      if (!mountedRef.current) return;

      if (retriesRef.current < retryCount) {
        retriesRef.current += 1;
        setTimeout(() => executeFetch(isRefetch), retryDelay * retriesRef.current);
      } else {
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Unknown error',
          isLoading: false,
          isRefetching: false,
        }));
      }
    }
  }, [url, fetchFn, retryCount, retryDelay]);

  useEffect(() => {
    mountedRef.current = true;
    executeFetch();
    return () => { mountedRef.current = false; };
  }, [executeFetch]);

  const handleRetry = useCallback(() => {
    retriesRef.current = 0;
    executeFetch();
  }, [executeFetch]);

  const handleRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastFetchRef.current < staleTime) return;
    executeFetch(true);
  }, [executeFetch, staleTime]);

  if (state.isLoading) {
    return (
      <div className={clsx(styles.container, styles.loading, className)}>
        {placeholder || (
          <div className={styles.skeleton}>
            <div className={styles.skeletonLine} style={{ width: '60%' }} />
            <div className={styles.skeletonLine} style={{ width: '80%' }} />
            <div className={styles.skeletonLine} style={{ width: '40%' }} />
          </div>
        )}
      </div>
    );
  }

  if (state.error) {
    return (
      <div className={clsx(styles.container, styles.error, className)}>
        {errorFallback ? errorFallback(state.error, handleRetry) : (
          <div className={styles.errorContent}>
            <span className={styles.errorIcon}>⚠</span>
            <p className={styles.errorMessage}>{state.error}</p>
            <button className={styles.retryBtn} onClick={handleRetry}>
              Retry ({retriesRef.current}/{retryCount} attempts)
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={clsx(styles.container, className)}>
      {state.isRefetching && <div className={styles.refetchIndicator}>Refreshing…</div>}
      <button className={styles.refreshBtn} onClick={handleRefresh}>
        ↻ Refresh
      </button>
      {renderProp ? renderProp(state) : (
        <pre className={styles.raw}>{JSON.stringify(state.data, null, 2)}</pre>
      )}
      <div className={styles.related}>
      <SupportFunnel />
      <SupportErrorBoundary />
      </div>
    </div>
  );
}
