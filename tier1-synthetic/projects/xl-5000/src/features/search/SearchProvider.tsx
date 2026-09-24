import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SearchHOC from './SearchHOC';
import SearchBadge1 from './SearchBadge1';
import ProjectsTimePicker from '../projects/ProjectsTimePicker';

interface SearchProviderState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SearchProviderContextValue {
  state: SearchProviderState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SearchProviderContext = createContext<SearchProviderContextValue | null>(null);

export function useSearchProvider() {
  const ctx = useContext(SearchProviderContext);
  if (!ctx) {
    throw new Error(`useSearchProvider must be used within a SearchProvider`);
  }
  return ctx;
}

interface SearchProviderProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SearchProvider({
  children,
  initialActive = false,
  initialLabel = 'SearchProvider',
}: SearchProviderProps) {
  const [state, setState] = useState<SearchProviderState>({
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

  const contextValue = useMemo<SearchProviderContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SearchProviderContext.Provider value={contextValue}>
      {children}
      <SearchHOC />
      <SearchBadge1 />
      <ProjectsTimePicker />
    </SearchProviderContext.Provider>
  );
}
