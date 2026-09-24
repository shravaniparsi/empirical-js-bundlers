import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import FeedbackMgmtPrefetch from './FeedbackMgmtPrefetch';
import FeedbackMgmtFeed from './FeedbackMgmtFeed';
import SurveysPaginated1 from '../surveys/SurveysPaginated1';
import FeedbackMgmtSummary from './FeedbackMgmtSummary';
import ReviewsSidebar from '../reviews/ReviewsSidebar';

interface FeedbackMgmtHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface FeedbackMgmtHOCContextValue {
  state: FeedbackMgmtHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const FeedbackMgmtHOCContext = createContext<FeedbackMgmtHOCContextValue | null>(null);

export function useFeedbackMgmtHOC() {
  const ctx = useContext(FeedbackMgmtHOCContext);
  if (!ctx) {
    throw new Error(`useFeedbackMgmtHOC must be used within a FeedbackMgmtHOC`);
  }
  return ctx;
}

interface FeedbackMgmtHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function FeedbackMgmtHOC({
  children,
  initialActive = false,
  initialLabel = 'FeedbackMgmtHOC',
}: FeedbackMgmtHOCProps) {
  const [state, setState] = useState<FeedbackMgmtHOCState>({
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

  const contextValue = useMemo<FeedbackMgmtHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <FeedbackMgmtHOCContext.Provider value={contextValue}>
      {children}
      <FeedbackMgmtPrefetch />
      <FeedbackMgmtFeed />
      <SurveysPaginated1 />
      <FeedbackMgmtSummary />
      <ReviewsSidebar />
    </FeedbackMgmtHOCContext.Provider>
  );
}
