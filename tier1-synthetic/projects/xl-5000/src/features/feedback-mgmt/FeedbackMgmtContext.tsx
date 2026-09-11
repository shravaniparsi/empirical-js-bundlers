import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import FeedbackMgmtTooltip1 from './FeedbackMgmtTooltip1';
import FeedbackMgmtDonut from './FeedbackMgmtDonut';
import FeedbackMgmtCheckbox from './FeedbackMgmtCheckbox';

interface FeedbackMgmtContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface FeedbackMgmtContextContextValue {
  state: FeedbackMgmtContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const FeedbackMgmtContextContext = createContext<FeedbackMgmtContextContextValue | null>(null);

export function useFeedbackMgmtContext() {
  const ctx = useContext(FeedbackMgmtContextContext);
  if (!ctx) {
    throw new Error(`useFeedbackMgmtContext must be used within a FeedbackMgmtContext`);
  }
  return ctx;
}

interface FeedbackMgmtContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function FeedbackMgmtContext({
  children,
  initialActive = false,
  initialLabel = 'FeedbackMgmtContext',
}: FeedbackMgmtContextProps) {
  const [state, setState] = useState<FeedbackMgmtContextState>({
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

  const contextValue = useMemo<FeedbackMgmtContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <FeedbackMgmtContextContext.Provider value={contextValue}>
      {children}
      <FeedbackMgmtTooltip1 />
      <FeedbackMgmtDonut />
      <FeedbackMgmtCheckbox />
    </FeedbackMgmtContextContext.Provider>
  );
}
