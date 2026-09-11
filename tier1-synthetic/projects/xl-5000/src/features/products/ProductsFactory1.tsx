import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ProductsLink from './ProductsLink';
import ProductsBanner from './ProductsBanner';

interface ProductsFactory1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ProductsFactory1ContextValue {
  state: ProductsFactory1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ProductsFactory1Context = createContext<ProductsFactory1ContextValue | null>(null);

export function useProductsFactory1() {
  const ctx = useContext(ProductsFactory1Context);
  if (!ctx) {
    throw new Error(`useProductsFactory1 must be used within a ProductsFactory1`);
  }
  return ctx;
}

interface ProductsFactory1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ProductsFactory1({
  children,
  initialActive = false,
  initialLabel = 'ProductsFactory1',
}: ProductsFactory1Props) {
  const [state, setState] = useState<ProductsFactory1State>({
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

  const contextValue = useMemo<ProductsFactory1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ProductsFactory1Context.Provider value={contextValue}>
      {children}
      <ProductsLink />
      <ProductsBanner />
    </ProductsFactory1Context.Provider>
  );
}
