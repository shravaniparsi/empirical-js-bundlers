import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ReviewsHook from './ReviewsHook';
import ReviewsProgress1 from './ReviewsProgress1';
import ReviewsTimePicker1 from './ReviewsTimePicker1';

interface ReviewsComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ReviewsComposerContextValue {
  state: ReviewsComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ReviewsComposerContext = createContext<ReviewsComposerContextValue | null>(null);

export function useReviewsComposer() {
  const ctx = useContext(ReviewsComposerContext);
  if (!ctx) {
    throw new Error(`useReviewsComposer must be used within a ReviewsComposer`);
  }
  return ctx;
}

interface ReviewsComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ReviewsComposer({
  children,
  initialActive = false,
  initialLabel = 'ReviewsComposer',
}: ReviewsComposerProps) {
  const [state, setState] = useState<ReviewsComposerState>({
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

  const contextValue = useMemo<ReviewsComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ReviewsComposerContext.Provider value={contextValue}>
      {children}
      <ReviewsHook />
      <ReviewsProgress1 />
      <ReviewsTimePicker1 />
    </ReviewsComposerContext.Provider>
  );
}
