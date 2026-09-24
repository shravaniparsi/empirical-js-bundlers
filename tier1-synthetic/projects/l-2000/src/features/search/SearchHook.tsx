import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SearchRegistry from './SearchRegistry';
import SearchNavBar from './SearchNavBar';
import SearchColorPicker1 from './SearchColorPicker1';

interface SearchHookState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SearchHookContextValue {
  state: SearchHookState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SearchHookContext = createContext<SearchHookContextValue | null>(null);

export function useSearchHook() {
  const ctx = useContext(SearchHookContext);
  if (!ctx) {
    throw new Error(`useSearchHook must be used within a SearchHook`);
  }
  return ctx;
}

interface SearchHookProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SearchHook({
  children,
  initialActive = false,
  initialLabel = 'SearchHook',
}: SearchHookProps) {
  const [state, setState] = useState<SearchHookState>({
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

  const contextValue = useMemo<SearchHookContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SearchHookContext.Provider value={contextValue}>
      {children}
      <SearchRegistry />
      <SearchNavBar />
      <SearchColorPicker1 />
    </SearchHookContext.Provider>
  );
}
