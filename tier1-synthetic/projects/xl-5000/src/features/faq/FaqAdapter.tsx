import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import FaqSpinner from './FaqSpinner';

interface FaqAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface FaqAdapterContextValue {
  state: FaqAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const FaqAdapterContext = createContext<FaqAdapterContextValue | null>(null);

export function useFaqAdapter() {
  const ctx = useContext(FaqAdapterContext);
  if (!ctx) {
    throw new Error(`useFaqAdapter must be used within a FaqAdapter`);
  }
  return ctx;
}

interface FaqAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function FaqAdapter({
  children,
  initialActive = false,
  initialLabel = 'FaqAdapter',
}: FaqAdapterProps) {
  const [state, setState] = useState<FaqAdapterState>({
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

  const contextValue = useMemo<FaqAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <FaqAdapterContext.Provider value={contextValue}>
      {children}
      <FaqSpinner />
    </FaqAdapterContext.Provider>
  );
}
