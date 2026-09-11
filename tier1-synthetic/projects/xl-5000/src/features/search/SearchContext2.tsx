import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface SearchContext2State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SearchContext2ContextValue {
  state: SearchContext2State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SearchContext2Context = createContext<SearchContext2ContextValue | null>(null);

export function useSearchContext2() {
  const ctx = useContext(SearchContext2Context);
  if (!ctx) {
    throw new Error(`useSearchContext2 must be used within a SearchContext2`);
  }
  return ctx;
}

interface SearchContext2Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SearchContext2({
  children,
  initialActive = false,
  initialLabel = 'SearchContext2',
}: SearchContext2Props) {
  const [state, setState] = useState<SearchContext2State>({
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

  const contextValue = useMemo<SearchContext2ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SearchContext2Context.Provider value={contextValue}>
      {children}

    </SearchContext2Context.Provider>
  );
}
