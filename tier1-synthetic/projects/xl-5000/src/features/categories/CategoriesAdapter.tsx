import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CategoriesGrid1 from './CategoriesGrid1';
import CategoriesGrid from './CategoriesGrid';

interface CategoriesAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CategoriesAdapterContextValue {
  state: CategoriesAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CategoriesAdapterContext = createContext<CategoriesAdapterContextValue | null>(null);

export function useCategoriesAdapter() {
  const ctx = useContext(CategoriesAdapterContext);
  if (!ctx) {
    throw new Error(`useCategoriesAdapter must be used within a CategoriesAdapter`);
  }
  return ctx;
}

interface CategoriesAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CategoriesAdapter({
  children,
  initialActive = false,
  initialLabel = 'CategoriesAdapter',
}: CategoriesAdapterProps) {
  const [state, setState] = useState<CategoriesAdapterState>({
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

  const contextValue = useMemo<CategoriesAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CategoriesAdapterContext.Provider value={contextValue}>
      {children}
      <CategoriesGrid1 />
      <CategoriesGrid />
    </CategoriesAdapterContext.Provider>
  );
}
