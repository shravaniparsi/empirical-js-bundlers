import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ReviewsNotification from './ReviewsNotification';

interface ReviewsHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ReviewsHOCContextValue {
  state: ReviewsHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ReviewsHOCContext = createContext<ReviewsHOCContextValue | null>(null);

export function useReviewsHOC() {
  const ctx = useContext(ReviewsHOCContext);
  if (!ctx) {
    throw new Error(`useReviewsHOC must be used within a ReviewsHOC`);
  }
  return ctx;
}

interface ReviewsHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ReviewsHOC({
  children,
  initialActive = false,
  initialLabel = 'ReviewsHOC',
}: ReviewsHOCProps) {
  const [state, setState] = useState<ReviewsHOCState>({
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

  const contextValue = useMemo<ReviewsHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ReviewsHOCContext.Provider value={contextValue}>
      {children}
      <ReviewsNotification />
    </ReviewsHOCContext.Provider>
  );
}
