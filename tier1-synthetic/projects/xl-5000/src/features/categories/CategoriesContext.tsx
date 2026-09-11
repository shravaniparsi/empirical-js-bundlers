import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CategoriesBridge from './CategoriesBridge';
import CategoriesSpacer1 from './CategoriesSpacer1';
import CategoriesGrid2 from './CategoriesGrid2';

interface CategoriesContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CategoriesContextContextValue {
  state: CategoriesContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CategoriesContextContext = createContext<CategoriesContextContextValue | null>(null);

export function useCategoriesContext() {
  const ctx = useContext(CategoriesContextContext);
  if (!ctx) {
    throw new Error(`useCategoriesContext must be used within a CategoriesContext`);
  }
  return ctx;
}

interface CategoriesContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CategoriesContext({
  children,
  initialActive = false,
  initialLabel = 'CategoriesContext',
}: CategoriesContextProps) {
  const [state, setState] = useState<CategoriesContextState>({
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

  const contextValue = useMemo<CategoriesContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CategoriesContextContext.Provider value={contextValue}>
      {children}
      <CategoriesBridge />
      <CategoriesSpacer1 />
      <CategoriesGrid2 />
    </CategoriesContextContext.Provider>
  );
}
