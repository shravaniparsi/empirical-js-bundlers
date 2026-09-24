import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SearchSparkline from './SearchSparkline';
import SearchColorPicker from './SearchColorPicker';

interface SearchWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SearchWrapperContextValue {
  state: SearchWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SearchWrapperContext = createContext<SearchWrapperContextValue | null>(null);

export function useSearchWrapper() {
  const ctx = useContext(SearchWrapperContext);
  if (!ctx) {
    throw new Error(`useSearchWrapper must be used within a SearchWrapper`);
  }
  return ctx;
}

interface SearchWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SearchWrapper({
  children,
  initialActive = false,
  initialLabel = 'SearchWrapper',
}: SearchWrapperProps) {
  const [state, setState] = useState<SearchWrapperState>({
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

  const contextValue = useMemo<SearchWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SearchWrapperContext.Provider value={contextValue}>
      {children}
      <SearchSparkline />
      <SearchColorPicker />
    </SearchWrapperContext.Provider>
  );
}
