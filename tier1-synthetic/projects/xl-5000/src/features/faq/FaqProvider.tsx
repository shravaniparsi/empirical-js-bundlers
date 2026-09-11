import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import FaqHeader from './FaqHeader';
import FormsColorPicker from '../forms/FormsColorPicker';

interface FaqProviderState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface FaqProviderContextValue {
  state: FaqProviderState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const FaqProviderContext = createContext<FaqProviderContextValue | null>(null);

export function useFaqProvider() {
  const ctx = useContext(FaqProviderContext);
  if (!ctx) {
    throw new Error(`useFaqProvider must be used within a FaqProvider`);
  }
  return ctx;
}

interface FaqProviderProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function FaqProvider({
  children,
  initialActive = false,
  initialLabel = 'FaqProvider',
}: FaqProviderProps) {
  const [state, setState] = useState<FaqProviderState>({
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

  const contextValue = useMemo<FaqProviderContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <FaqProviderContext.Provider value={contextValue}>
      {children}
      <FaqHeader />
      <FormsColorPicker />
    </FaqProviderContext.Provider>
  );
}
