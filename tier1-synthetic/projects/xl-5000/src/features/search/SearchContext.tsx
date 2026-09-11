import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SearchTag from './SearchTag';

interface SearchContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SearchContextContextValue {
  state: SearchContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SearchContextContext = createContext<SearchContextContextValue | null>(null);

export function useSearchContext() {
  const ctx = useContext(SearchContextContext);
  if (!ctx) {
    throw new Error(`useSearchContext must be used within a SearchContext`);
  }
  return ctx;
}

interface SearchContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SearchContext({
  children,
  initialActive = false,
  initialLabel = 'SearchContext',
}: SearchContextProps) {
  const [state, setState] = useState<SearchContextState>({
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

  const contextValue = useMemo<SearchContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SearchContextContext.Provider value={contextValue}>
      {children}
      <SearchTag />
    </SearchContextContext.Provider>
  );
}
