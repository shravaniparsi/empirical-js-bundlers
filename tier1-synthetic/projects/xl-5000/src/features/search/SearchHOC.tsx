import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SearchSticky from './SearchSticky';
import SearchChip from './SearchChip';
import OrdersScore1 from '../orders/OrdersScore1';

interface SearchHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SearchHOCContextValue {
  state: SearchHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SearchHOCContext = createContext<SearchHOCContextValue | null>(null);

export function useSearchHOC() {
  const ctx = useContext(SearchHOCContext);
  if (!ctx) {
    throw new Error(`useSearchHOC must be used within a SearchHOC`);
  }
  return ctx;
}

interface SearchHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SearchHOC({
  children,
  initialActive = false,
  initialLabel = 'SearchHOC',
}: SearchHOCProps) {
  const [state, setState] = useState<SearchHOCState>({
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

  const contextValue = useMemo<SearchHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SearchHOCContext.Provider value={contextValue}>
      {children}
      <SearchSticky />
      <SearchChip />
      <OrdersScore1 />
    </SearchHOCContext.Provider>
  );
}
