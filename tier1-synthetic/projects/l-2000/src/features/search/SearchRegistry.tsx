import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SearchScatter from './SearchScatter';
import SearchSpinner from './SearchSpinner';
import SearchCollapse2 from './SearchCollapse2';

interface SearchRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SearchRegistryContextValue {
  state: SearchRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SearchRegistryContext = createContext<SearchRegistryContextValue | null>(null);

export function useSearchRegistry() {
  const ctx = useContext(SearchRegistryContext);
  if (!ctx) {
    throw new Error(`useSearchRegistry must be used within a SearchRegistry`);
  }
  return ctx;
}

interface SearchRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SearchRegistry({
  children,
  initialActive = false,
  initialLabel = 'SearchRegistry',
}: SearchRegistryProps) {
  const [state, setState] = useState<SearchRegistryState>({
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

  const contextValue = useMemo<SearchRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SearchRegistryContext.Provider value={contextValue}>
      {children}
      <SearchScatter />
      <SearchSpinner />
      <SearchCollapse2 />
    </SearchRegistryContext.Provider>
  );
}
