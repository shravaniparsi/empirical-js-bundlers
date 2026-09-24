import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ReviewsSummary from './ReviewsSummary';

interface ReviewsWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ReviewsWrapperContextValue {
  state: ReviewsWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ReviewsWrapperContext = createContext<ReviewsWrapperContextValue | null>(null);

export function useReviewsWrapper() {
  const ctx = useContext(ReviewsWrapperContext);
  if (!ctx) {
    throw new Error(`useReviewsWrapper must be used within a ReviewsWrapper`);
  }
  return ctx;
}

interface ReviewsWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ReviewsWrapper({
  children,
  initialActive = false,
  initialLabel = 'ReviewsWrapper',
}: ReviewsWrapperProps) {
  const [state, setState] = useState<ReviewsWrapperState>({
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

  const contextValue = useMemo<ReviewsWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ReviewsWrapperContext.Provider value={contextValue}>
      {children}
      <ReviewsSummary />
    </ReviewsWrapperContext.Provider>
  );
}
