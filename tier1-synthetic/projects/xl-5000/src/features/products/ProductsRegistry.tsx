import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ProductsNotification1 from './ProductsNotification1';

interface ProductsRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ProductsRegistryContextValue {
  state: ProductsRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ProductsRegistryContext = createContext<ProductsRegistryContextValue | null>(null);

export function useProductsRegistry() {
  const ctx = useContext(ProductsRegistryContext);
  if (!ctx) {
    throw new Error(`useProductsRegistry must be used within a ProductsRegistry`);
  }
  return ctx;
}

interface ProductsRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ProductsRegistry({
  children,
  initialActive = false,
  initialLabel = 'ProductsRegistry',
}: ProductsRegistryProps) {
  const [state, setState] = useState<ProductsRegistryState>({
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

  const contextValue = useMemo<ProductsRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ProductsRegistryContext.Provider value={contextValue}>
      {children}
      <ProductsNotification1 />
    </ProductsRegistryContext.Provider>
  );
}
