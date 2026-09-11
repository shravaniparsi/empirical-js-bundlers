import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ProductsBadge from './ProductsBadge';

interface ProductsWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ProductsWrapperContextValue {
  state: ProductsWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ProductsWrapperContext = createContext<ProductsWrapperContextValue | null>(null);

export function useProductsWrapper() {
  const ctx = useContext(ProductsWrapperContext);
  if (!ctx) {
    throw new Error(`useProductsWrapper must be used within a ProductsWrapper`);
  }
  return ctx;
}

interface ProductsWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ProductsWrapper({
  children,
  initialActive = false,
  initialLabel = 'ProductsWrapper',
}: ProductsWrapperProps) {
  const [state, setState] = useState<ProductsWrapperState>({
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

  const contextValue = useMemo<ProductsWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ProductsWrapperContext.Provider value={contextValue}>
      {children}
      <ProductsBadge />
    </ProductsWrapperContext.Provider>
  );
}
