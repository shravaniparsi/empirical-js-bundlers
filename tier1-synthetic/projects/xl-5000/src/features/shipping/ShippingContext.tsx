import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ShippingTimeline from './ShippingTimeline';
import ShippingBridge from './ShippingBridge';
import ShippingAvatar from './ShippingAvatar';
import NotificationsHeatmap1 from '../notifications/NotificationsHeatmap1';

interface ShippingContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ShippingContextContextValue {
  state: ShippingContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ShippingContextContext = createContext<ShippingContextContextValue | null>(null);

export function useShippingContext() {
  const ctx = useContext(ShippingContextContext);
  if (!ctx) {
    throw new Error(`useShippingContext must be used within a ShippingContext`);
  }
  return ctx;
}

interface ShippingContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ShippingContext({
  children,
  initialActive = false,
  initialLabel = 'ShippingContext',
}: ShippingContextProps) {
  const [state, setState] = useState<ShippingContextState>({
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

  const contextValue = useMemo<ShippingContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ShippingContextContext.Provider value={contextValue}>
      {children}
      <ShippingTimeline />
      <ShippingBridge />
      <ShippingAvatar />
      <NotificationsHeatmap1 />
    </ShippingContextContext.Provider>
  );
}
