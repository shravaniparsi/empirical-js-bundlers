import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import FeedbackMgmtLink from './FeedbackMgmtLink';
import FeedbackMgmtPrefetch1 from './FeedbackMgmtPrefetch1';

interface FeedbackMgmtContext2State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface FeedbackMgmtContext2ContextValue {
  state: FeedbackMgmtContext2State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const FeedbackMgmtContext2Context = createContext<FeedbackMgmtContext2ContextValue | null>(null);

export function useFeedbackMgmtContext2() {
  const ctx = useContext(FeedbackMgmtContext2Context);
  if (!ctx) {
    throw new Error(`useFeedbackMgmtContext2 must be used within a FeedbackMgmtContext2`);
  }
  return ctx;
}

interface FeedbackMgmtContext2Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function FeedbackMgmtContext2({
  children,
  initialActive = false,
  initialLabel = 'FeedbackMgmtContext2',
}: FeedbackMgmtContext2Props) {
  const [state, setState] = useState<FeedbackMgmtContext2State>({
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

  const contextValue = useMemo<FeedbackMgmtContext2ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <FeedbackMgmtContext2Context.Provider value={contextValue}>
      {children}
      <FeedbackMgmtLink />
      <FeedbackMgmtPrefetch1 />
    </FeedbackMgmtContext2Context.Provider>
  );
}
