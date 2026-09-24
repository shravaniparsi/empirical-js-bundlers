import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ProductsBanner1 from './ProductsBanner1';
import ProductsRadio1 from './ProductsRadio1';
import ProductsComposer from './ProductsComposer';

interface ProductsAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ProductsAdapterContextValue {
  state: ProductsAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ProductsAdapterContext = createContext<ProductsAdapterContextValue | null>(null);

export function useProductsAdapter() {
  const ctx = useContext(ProductsAdapterContext);
  if (!ctx) {
    throw new Error(`useProductsAdapter must be used within a ProductsAdapter`);
  }
  return ctx;
}

interface ProductsAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ProductsAdapter({
  children,
  initialActive = false,
  initialLabel = 'ProductsAdapter',
}: ProductsAdapterProps) {
  const [state, setState] = useState<ProductsAdapterState>({
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

  const contextValue = useMemo<ProductsAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ProductsAdapterContext.Provider value={contextValue}>
      {children}
      <ProductsBanner1 />
      <ProductsRadio1 />
      <ProductsComposer />
    </ProductsAdapterContext.Provider>
  );
}
