import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CatalogLabel from './CatalogLabel';
import CatalogBarChart from './CatalogBarChart';
import CatalogPanel2 from './CatalogPanel2';

interface CatalogAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CatalogAdapterContextValue {
  state: CatalogAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CatalogAdapterContext = createContext<CatalogAdapterContextValue | null>(null);

export function useCatalogAdapter() {
  const ctx = useContext(CatalogAdapterContext);
  if (!ctx) {
    throw new Error(`useCatalogAdapter must be used within a CatalogAdapter`);
  }
  return ctx;
}

interface CatalogAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CatalogAdapter({
  children,
  initialActive = false,
  initialLabel = 'CatalogAdapter',
}: CatalogAdapterProps) {
  const [state, setState] = useState<CatalogAdapterState>({
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

  const contextValue = useMemo<CatalogAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CatalogAdapterContext.Provider value={contextValue}>
      {children}
      <CatalogLabel />
      <CatalogBarChart />
      <CatalogPanel2 />
    </CatalogAdapterContext.Provider>
  );
}
