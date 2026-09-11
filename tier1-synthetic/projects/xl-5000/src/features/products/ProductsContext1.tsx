import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ProductsAvatar from './ProductsAvatar';
import ProductsSpinner from './ProductsSpinner';

interface ProductsContext1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ProductsContext1ContextValue {
  state: ProductsContext1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ProductsContext1Context = createContext<ProductsContext1ContextValue | null>(null);

export function useProductsContext1() {
  const ctx = useContext(ProductsContext1Context);
  if (!ctx) {
    throw new Error(`useProductsContext1 must be used within a ProductsContext1`);
  }
  return ctx;
}

interface ProductsContext1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ProductsContext1({
  children,
  initialActive = false,
  initialLabel = 'ProductsContext1',
}: ProductsContext1Props) {
  const [state, setState] = useState<ProductsContext1State>({
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

  const contextValue = useMemo<ProductsContext1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ProductsContext1Context.Provider value={contextValue}>
      {children}
      <ProductsAvatar />
      <ProductsSpinner />
    </ProductsContext1Context.Provider>
  );
}
