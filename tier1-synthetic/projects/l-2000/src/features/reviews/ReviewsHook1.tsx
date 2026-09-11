import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ReviewsRegistry from './ReviewsRegistry';
import ReviewsRetry from './ReviewsRetry';
import ReviewsTreeView from './ReviewsTreeView';

interface ReviewsHook1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ReviewsHook1ContextValue {
  state: ReviewsHook1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ReviewsHook1Context = createContext<ReviewsHook1ContextValue | null>(null);

export function useReviewsHook1() {
  const ctx = useContext(ReviewsHook1Context);
  if (!ctx) {
    throw new Error(`useReviewsHook1 must be used within a ReviewsHook1`);
  }
  return ctx;
}

interface ReviewsHook1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ReviewsHook1({
  children,
  initialActive = false,
  initialLabel = 'ReviewsHook1',
}: ReviewsHook1Props) {
  const [state, setState] = useState<ReviewsHook1State>({
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

  const contextValue = useMemo<ReviewsHook1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ReviewsHook1Context.Provider value={contextValue}>
      {children}
      <ReviewsRegistry />
      <ReviewsRetry />
      <ReviewsTreeView />
    </ReviewsHook1Context.Provider>
  );
}
