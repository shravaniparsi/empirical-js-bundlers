import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import FeedbackMgmtTooltip from './FeedbackMgmtTooltip';
import ActivityGrid3 from '../activity/ActivityGrid3';

interface FeedbackMgmtContext1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface FeedbackMgmtContext1ContextValue {
  state: FeedbackMgmtContext1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const FeedbackMgmtContext1Context = createContext<FeedbackMgmtContext1ContextValue | null>(null);

export function useFeedbackMgmtContext1() {
  const ctx = useContext(FeedbackMgmtContext1Context);
  if (!ctx) {
    throw new Error(`useFeedbackMgmtContext1 must be used within a FeedbackMgmtContext1`);
  }
  return ctx;
}

interface FeedbackMgmtContext1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function FeedbackMgmtContext1({
  children,
  initialActive = false,
  initialLabel = 'FeedbackMgmtContext1',
}: FeedbackMgmtContext1Props) {
  const [state, setState] = useState<FeedbackMgmtContext1State>({
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

  const contextValue = useMemo<FeedbackMgmtContext1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <FeedbackMgmtContext1Context.Provider value={contextValue}>
      {children}
      <FeedbackMgmtTooltip />
      <ActivityGrid3 />
    </FeedbackMgmtContext1Context.Provider>
  );
}
