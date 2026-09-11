import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SearchResponsive1 from './SearchResponsive1';

interface SearchProvider1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SearchProvider1ContextValue {
  state: SearchProvider1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SearchProvider1Context = createContext<SearchProvider1ContextValue | null>(null);

export function useSearchProvider1() {
  const ctx = useContext(SearchProvider1Context);
  if (!ctx) {
    throw new Error(`useSearchProvider1 must be used within a SearchProvider1`);
  }
  return ctx;
}

interface SearchProvider1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SearchProvider1({
  children,
  initialActive = false,
  initialLabel = 'SearchProvider1',
}: SearchProvider1Props) {
  const [state, setState] = useState<SearchProvider1State>({
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

  const contextValue = useMemo<SearchProvider1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SearchProvider1Context.Provider value={contextValue}>
      {children}
      <SearchResponsive1 />
    </SearchProvider1Context.Provider>
  );
}
