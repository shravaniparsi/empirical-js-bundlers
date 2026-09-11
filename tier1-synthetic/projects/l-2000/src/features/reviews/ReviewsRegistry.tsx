import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ReviewsToast from './ReviewsToast';
import ReviewsHeader from './ReviewsHeader';
import ReviewsAlert from './ReviewsAlert';

interface ReviewsRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ReviewsRegistryContextValue {
  state: ReviewsRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ReviewsRegistryContext = createContext<ReviewsRegistryContextValue | null>(null);

export function useReviewsRegistry() {
  const ctx = useContext(ReviewsRegistryContext);
  if (!ctx) {
    throw new Error(`useReviewsRegistry must be used within a ReviewsRegistry`);
  }
  return ctx;
}

interface ReviewsRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ReviewsRegistry({
  children,
  initialActive = false,
  initialLabel = 'ReviewsRegistry',
}: ReviewsRegistryProps) {
  const [state, setState] = useState<ReviewsRegistryState>({
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

  const contextValue = useMemo<ReviewsRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ReviewsRegistryContext.Provider value={contextValue}>
      {children}
      <ReviewsToast />
      <ReviewsHeader />
      <ReviewsAlert />
    </ReviewsRegistryContext.Provider>
  );
}
