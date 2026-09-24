import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface CheckoutHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CheckoutHOCContextValue {
  state: CheckoutHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CheckoutHOCContext = createContext<CheckoutHOCContextValue | null>(null);

export function useCheckoutHOC() {
  const ctx = useContext(CheckoutHOCContext);
  if (!ctx) {
    throw new Error(`useCheckoutHOC must be used within a CheckoutHOC`);
  }
  return ctx;
}

interface CheckoutHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CheckoutHOC({
  children,
  initialActive = false,
  initialLabel = 'CheckoutHOC',
}: CheckoutHOCProps) {
  const [state, setState] = useState<CheckoutHOCState>({
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

  const contextValue = useMemo<CheckoutHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CheckoutHOCContext.Provider value={contextValue}>
      {children}

    </CheckoutHOCContext.Provider>
  );
}
