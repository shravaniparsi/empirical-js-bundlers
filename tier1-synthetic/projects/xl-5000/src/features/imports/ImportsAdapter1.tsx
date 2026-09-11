import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ImportsHeatmap from './ImportsHeatmap';
import ProductsDetail from '../products/ProductsDetail';
import BillingRangeSlider1 from '../billing/BillingRangeSlider1';
import ActivityGrid3 from '../activity/ActivityGrid3';

interface ImportsAdapter1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ImportsAdapter1ContextValue {
  state: ImportsAdapter1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ImportsAdapter1Context = createContext<ImportsAdapter1ContextValue | null>(null);

export function useImportsAdapter1() {
  const ctx = useContext(ImportsAdapter1Context);
  if (!ctx) {
    throw new Error(`useImportsAdapter1 must be used within a ImportsAdapter1`);
  }
  return ctx;
}

interface ImportsAdapter1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ImportsAdapter1({
  children,
  initialActive = false,
  initialLabel = 'ImportsAdapter1',
}: ImportsAdapter1Props) {
  const [state, setState] = useState<ImportsAdapter1State>({
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

  const contextValue = useMemo<ImportsAdapter1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ImportsAdapter1Context.Provider value={contextValue}>
      {children}
      <ImportsHeatmap />
      <ProductsDetail />
      <BillingRangeSlider1 />
      <ActivityGrid3 />
    </ImportsAdapter1Context.Provider>
  );
}
