import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SearchStat from './SearchStat';
import SearchNotification from './SearchNotification';

interface SearchAdapter1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SearchAdapter1ContextValue {
  state: SearchAdapter1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SearchAdapter1Context = createContext<SearchAdapter1ContextValue | null>(null);

export function useSearchAdapter1() {
  const ctx = useContext(SearchAdapter1Context);
  if (!ctx) {
    throw new Error(`useSearchAdapter1 must be used within a SearchAdapter1`);
  }
  return ctx;
}

interface SearchAdapter1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SearchAdapter1({
  children,
  initialActive = false,
  initialLabel = 'SearchAdapter1',
}: SearchAdapter1Props) {
  const [state, setState] = useState<SearchAdapter1State>({
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

  const contextValue = useMemo<SearchAdapter1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SearchAdapter1Context.Provider value={contextValue}>
      {children}
      <SearchStat />
      <SearchNotification />
    </SearchAdapter1Context.Provider>
  );
}
