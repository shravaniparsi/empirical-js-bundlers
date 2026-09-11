import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CartThumbnail from './CartThumbnail';
import CartPreview from './CartPreview';

interface CartWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CartWrapperContextValue {
  state: CartWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CartWrapperContext = createContext<CartWrapperContextValue | null>(null);

export function useCartWrapper() {
  const ctx = useContext(CartWrapperContext);
  if (!ctx) {
    throw new Error(`useCartWrapper must be used within a CartWrapper`);
  }
  return ctx;
}

interface CartWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CartWrapper({
  children,
  initialActive = false,
  initialLabel = 'CartWrapper',
}: CartWrapperProps) {
  const [state, setState] = useState<CartWrapperState>({
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

  const contextValue = useMemo<CartWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CartWrapperContext.Provider value={contextValue}>
      {children}
      <CartThumbnail />
      <CartPreview />
    </CartWrapperContext.Provider>
  );
}
