import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import BillingCheckbox3 from './BillingCheckbox3';
import BillingColorPicker from './BillingColorPicker';

interface BillingProvider1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface BillingProvider1ContextValue {
  state: BillingProvider1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const BillingProvider1Context = createContext<BillingProvider1ContextValue | null>(null);

export function useBillingProvider1() {
  const ctx = useContext(BillingProvider1Context);
  if (!ctx) {
    throw new Error(`useBillingProvider1 must be used within a BillingProvider1`);
  }
  return ctx;
}

interface BillingProvider1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function BillingProvider1({
  children,
  initialActive = false,
  initialLabel = 'BillingProvider1',
}: BillingProvider1Props) {
  const [state, setState] = useState<BillingProvider1State>({
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

  const contextValue = useMemo<BillingProvider1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <BillingProvider1Context.Provider value={contextValue}>
      {children}
      <BillingCheckbox3 />
      <BillingColorPicker />
    </BillingProvider1Context.Provider>
  );
}
