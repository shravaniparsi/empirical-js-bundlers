import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CategoriesSparkline from './CategoriesSparkline';
import CategoriesPreview1 from './CategoriesPreview1';

interface CategoriesBridgeState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CategoriesBridgeContextValue {
  state: CategoriesBridgeState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CategoriesBridgeContext = createContext<CategoriesBridgeContextValue | null>(null);

export function useCategoriesBridge() {
  const ctx = useContext(CategoriesBridgeContext);
  if (!ctx) {
    throw new Error(`useCategoriesBridge must be used within a CategoriesBridge`);
  }
  return ctx;
}

interface CategoriesBridgeProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CategoriesBridge({
  children,
  initialActive = false,
  initialLabel = 'CategoriesBridge',
}: CategoriesBridgeProps) {
  const [state, setState] = useState<CategoriesBridgeState>({
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

  const contextValue = useMemo<CategoriesBridgeContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CategoriesBridgeContext.Provider value={contextValue}>
      {children}
      <CategoriesSparkline />
      <CategoriesPreview1 />
    </CategoriesBridgeContext.Provider>
  );
}
