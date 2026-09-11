import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ImportsPreview from './ImportsPreview';
import ImportsGauge1 from './ImportsGauge1';
import ImportsSkeleton1 from './ImportsSkeleton1';
import SearchFunnel from '../search/SearchFunnel';
import AnalyticsList from '../analytics/AnalyticsList';
import ReviewsDetail1 from '../reviews/ReviewsDetail1';

interface ImportsProviderState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ImportsProviderContextValue {
  state: ImportsProviderState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ImportsProviderContext = createContext<ImportsProviderContextValue | null>(null);

export function useImportsProvider() {
  const ctx = useContext(ImportsProviderContext);
  if (!ctx) {
    throw new Error(`useImportsProvider must be used within a ImportsProvider`);
  }
  return ctx;
}

interface ImportsProviderProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ImportsProvider({
  children,
  initialActive = false,
  initialLabel = 'ImportsProvider',
}: ImportsProviderProps) {
  const [state, setState] = useState<ImportsProviderState>({
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

  const contextValue = useMemo<ImportsProviderContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ImportsProviderContext.Provider value={contextValue}>
      {children}
      <ImportsPreview />
      <ImportsGauge1 />
      <ImportsSkeleton1 />
      <SearchFunnel />
      <AnalyticsList />
      <ReviewsDetail1 />
    </ImportsProviderContext.Provider>
  );
}
