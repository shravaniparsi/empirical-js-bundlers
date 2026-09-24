import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ReviewsRetry from './ReviewsRetry';
import ReviewsHook from './ReviewsHook';
import WebhooksFeed1 from '../webhooks/WebhooksFeed1';

interface ReviewsContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ReviewsContextContextValue {
  state: ReviewsContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ReviewsContextContext = createContext<ReviewsContextContextValue | null>(null);

export function useReviewsContext() {
  const ctx = useContext(ReviewsContextContext);
  if (!ctx) {
    throw new Error(`useReviewsContext must be used within a ReviewsContext`);
  }
  return ctx;
}

interface ReviewsContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ReviewsContext({
  children,
  initialActive = false,
  initialLabel = 'ReviewsContext',
}: ReviewsContextProps) {
  const [state, setState] = useState<ReviewsContextState>({
    isActive: initialActive,
    count: 0,
    label: initialLabel,
    metadata: {},
  });

  const toggle = useCallback(() => {
    setState(prev => ({ ...prev, isActive: !prev.isActive }));
  }, []);

  const increment = useCallback(() => {
    setState(prev => ({ ...prev, count: prev.count + 1 }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isActive: initialActive,
      count: 0,
      label: initialLabel,
      metadata: {},
    });
  }, [initialActive, initialLabel]);

  const updateLabel = useCallback((label: string) => {
    setState(prev => ({ ...prev, label }));
  }, []);

  const setMeta = useCallback((key: string, value: unknown) => {
    setState(prev => ({
      ...prev,
      metadata: { ...prev.metadata, [key]: value },
    }));
  }, []);

  const contextValue = useMemo<ReviewsContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ReviewsContextContext.Provider value={contextValue}>
      {children}
      <ReviewsRetry />
      <ReviewsHook />
      <WebhooksFeed1 />
    </ReviewsContextContext.Provider>
  );
}
