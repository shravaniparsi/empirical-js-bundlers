import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ProductsAreaChart from './ProductsAreaChart';
import OrdersPanel from '../orders/OrdersPanel';
import DashboardScore from '../dashboard/DashboardScore';

interface ProductsContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ProductsContextContextValue {
  state: ProductsContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ProductsContextContext = createContext<ProductsContextContextValue | null>(null);

export function useProductsContext() {
  const ctx = useContext(ProductsContextContext);
  if (!ctx) {
    throw new Error(`useProductsContext must be used within a ProductsContext`);
  }
  return ctx;
}

interface ProductsContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ProductsContext({
  children,
  initialActive = false,
  initialLabel = 'ProductsContext',
}: ProductsContextProps) {
  const [state, setState] = useState<ProductsContextState>({
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

  const contextValue = useMemo<ProductsContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ProductsContextContext.Provider value={contextValue}>
      {children}
      <ProductsAreaChart />
      <OrdersPanel />
      <DashboardScore />
    </ProductsContextContext.Provider>
  );
}
