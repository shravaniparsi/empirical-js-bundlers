import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SearchScore from './SearchScore';
import SearchTag from './SearchTag';
import SearchPlaceholder from './SearchPlaceholder';
import BillingDetail3 from '../billing/BillingDetail3';

interface SearchAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SearchAdapterContextValue {
  state: SearchAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SearchAdapterContext = createContext<SearchAdapterContextValue | null>(null);

export function useSearchAdapter() {
  const ctx = useContext(SearchAdapterContext);
  if (!ctx) {
    throw new Error(`useSearchAdapter must be used within a SearchAdapter`);
  }
  return ctx;
}

interface SearchAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SearchAdapter({
  children,
  initialActive = false,
  initialLabel = 'SearchAdapter',
}: SearchAdapterProps) {
  const [state, setState] = useState<SearchAdapterState>({
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

  const contextValue = useMemo<SearchAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SearchAdapterContext.Provider value={contextValue}>
      {children}
      <SearchScore />
      <SearchTag />
      <SearchPlaceholder />
      <BillingDetail3 />
    </SearchAdapterContext.Provider>
  );
}
