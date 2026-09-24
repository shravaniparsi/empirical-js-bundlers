import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ShippingBanner3 from './ShippingBanner3';
import ShippingMenu from './ShippingMenu';
import ShippingProgress2 from './ShippingProgress2';
import WebhooksRegistry from '../webhooks/WebhooksRegistry';

interface ShippingAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ShippingAdapterContextValue {
  state: ShippingAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ShippingAdapterContext = createContext<ShippingAdapterContextValue | null>(null);

export function useShippingAdapter() {
  const ctx = useContext(ShippingAdapterContext);
  if (!ctx) {
    throw new Error(`useShippingAdapter must be used within a ShippingAdapter`);
  }
  return ctx;
}

interface ShippingAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ShippingAdapter({
  children,
  initialActive = false,
  initialLabel = 'ShippingAdapter',
}: ShippingAdapterProps) {
  const [state, setState] = useState<ShippingAdapterState>({
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

  const contextValue = useMemo<ShippingAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ShippingAdapterContext.Provider value={contextValue}>
      {children}
      <ShippingBanner3 />
      <ShippingMenu />
      <ShippingProgress2 />
      <WebhooksRegistry />
    </ShippingAdapterContext.Provider>
  );
}
