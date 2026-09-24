import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ProductsChip from './ProductsChip';
import ProductsRetry1 from './ProductsRetry1';
import ProductsPreview1 from './ProductsPreview1';

interface ProductsFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ProductsFactoryContextValue {
  state: ProductsFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ProductsFactoryContext = createContext<ProductsFactoryContextValue | null>(null);

export function useProductsFactory() {
  const ctx = useContext(ProductsFactoryContext);
  if (!ctx) {
    throw new Error(`useProductsFactory must be used within a ProductsFactory`);
  }
  return ctx;
}

interface ProductsFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ProductsFactory({
  children,
  initialActive = false,
  initialLabel = 'ProductsFactory',
}: ProductsFactoryProps) {
  const [state, setState] = useState<ProductsFactoryState>({
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

  const contextValue = useMemo<ProductsFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ProductsFactoryContext.Provider value={contextValue}>
      {children}
      <ProductsChip />
      <ProductsRetry1 />
      <ProductsPreview1 />
    </ProductsFactoryContext.Provider>
  );
}
