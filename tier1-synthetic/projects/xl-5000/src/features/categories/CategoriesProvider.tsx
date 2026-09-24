import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CategoriesToast from './CategoriesToast';
import CategoriesTreeView from './CategoriesTreeView';

interface CategoriesProviderState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CategoriesProviderContextValue {
  state: CategoriesProviderState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CategoriesProviderContext = createContext<CategoriesProviderContextValue | null>(null);

export function useCategoriesProvider() {
  const ctx = useContext(CategoriesProviderContext);
  if (!ctx) {
    throw new Error(`useCategoriesProvider must be used within a CategoriesProvider`);
  }
  return ctx;
}

interface CategoriesProviderProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CategoriesProvider({
  children,
  initialActive = false,
  initialLabel = 'CategoriesProvider',
}: CategoriesProviderProps) {
  const [state, setState] = useState<CategoriesProviderState>({
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

  const contextValue = useMemo<CategoriesProviderContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CategoriesProviderContext.Provider value={contextValue}>
      {children}
      <CategoriesToast />
      <CategoriesTreeView />
    </CategoriesProviderContext.Provider>
  );
}
