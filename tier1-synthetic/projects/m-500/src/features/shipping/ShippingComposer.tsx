import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ShippingBottomNav from './ShippingBottomNav';

interface ShippingComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ShippingComposerContextValue {
  state: ShippingComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ShippingComposerContext = createContext<ShippingComposerContextValue | null>(null);

export function useShippingComposer() {
  const ctx = useContext(ShippingComposerContext);
  if (!ctx) {
    throw new Error(`useShippingComposer must be used within a ShippingComposer`);
  }
  return ctx;
}

interface ShippingComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ShippingComposer({
  children,
  initialActive = false,
  initialLabel = 'ShippingComposer',
}: ShippingComposerProps) {
  const [state, setState] = useState<ShippingComposerState>({
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

  const contextValue = useMemo<ShippingComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ShippingComposerContext.Provider value={contextValue}>
      {children}
      <ShippingBottomNav />
    </ShippingComposerContext.Provider>
  );
}
