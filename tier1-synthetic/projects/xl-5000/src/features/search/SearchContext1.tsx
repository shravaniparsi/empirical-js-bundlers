import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SearchBadge1 from './SearchBadge1';
import SearchPrefetch from './SearchPrefetch';
import SearchContainer from './SearchContainer';

interface SearchContext1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SearchContext1ContextValue {
  state: SearchContext1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SearchContext1Context = createContext<SearchContext1ContextValue | null>(null);

export function useSearchContext1() {
  const ctx = useContext(SearchContext1Context);
  if (!ctx) {
    throw new Error(`useSearchContext1 must be used within a SearchContext1`);
  }
  return ctx;
}

interface SearchContext1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SearchContext1({
  children,
  initialActive = false,
  initialLabel = 'SearchContext1',
}: SearchContext1Props) {
  const [state, setState] = useState<SearchContext1State>({
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

  const contextValue = useMemo<SearchContext1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SearchContext1Context.Provider value={contextValue}>
      {children}
      <SearchBadge1 />
      <SearchPrefetch />
      <SearchContainer />
    </SearchContext1Context.Provider>
  );
}
