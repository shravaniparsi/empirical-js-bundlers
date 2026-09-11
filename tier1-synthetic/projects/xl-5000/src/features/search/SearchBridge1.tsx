import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface SearchBridge1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SearchBridge1ContextValue {
  state: SearchBridge1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SearchBridge1Context = createContext<SearchBridge1ContextValue | null>(null);

export function useSearchBridge1() {
  const ctx = useContext(SearchBridge1Context);
  if (!ctx) {
    throw new Error(`useSearchBridge1 must be used within a SearchBridge1`);
  }
  return ctx;
}

interface SearchBridge1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SearchBridge1({
  children,
  initialActive = false,
  initialLabel = 'SearchBridge1',
}: SearchBridge1Props) {
  const [state, setState] = useState<SearchBridge1State>({
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

  const contextValue = useMemo<SearchBridge1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SearchBridge1Context.Provider value={contextValue}>
      {children}

    </SearchBridge1Context.Provider>
  );
}
