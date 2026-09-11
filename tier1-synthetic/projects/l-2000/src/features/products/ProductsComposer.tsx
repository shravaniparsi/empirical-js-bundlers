import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface ProductsComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ProductsComposerContextValue {
  state: ProductsComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ProductsComposerContext = createContext<ProductsComposerContextValue | null>(null);

export function useProductsComposer() {
  const ctx = useContext(ProductsComposerContext);
  if (!ctx) {
    throw new Error(`useProductsComposer must be used within a ProductsComposer`);
  }
  return ctx;
}

interface ProductsComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ProductsComposer({
  children,
  initialActive = false,
  initialLabel = 'ProductsComposer',
}: ProductsComposerProps) {
  const [state, setState] = useState<ProductsComposerState>({
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

  const contextValue = useMemo<ProductsComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ProductsComposerContext.Provider value={contextValue}>
      {children}

    </ProductsComposerContext.Provider>
  );
}
