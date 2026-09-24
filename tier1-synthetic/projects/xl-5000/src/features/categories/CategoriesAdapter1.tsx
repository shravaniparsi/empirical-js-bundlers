import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CategoriesTreeView1 from './CategoriesTreeView1';

interface CategoriesAdapter1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CategoriesAdapter1ContextValue {
  state: CategoriesAdapter1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CategoriesAdapter1Context = createContext<CategoriesAdapter1ContextValue | null>(null);

export function useCategoriesAdapter1() {
  const ctx = useContext(CategoriesAdapter1Context);
  if (!ctx) {
    throw new Error(`useCategoriesAdapter1 must be used within a CategoriesAdapter1`);
  }
  return ctx;
}

interface CategoriesAdapter1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CategoriesAdapter1({
  children,
  initialActive = false,
  initialLabel = 'CategoriesAdapter1',
}: CategoriesAdapter1Props) {
  const [state, setState] = useState<CategoriesAdapter1State>({
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

  const contextValue = useMemo<CategoriesAdapter1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CategoriesAdapter1Context.Provider value={contextValue}>
      {children}
      <CategoriesTreeView1 />
    </CategoriesAdapter1Context.Provider>
  );
}
