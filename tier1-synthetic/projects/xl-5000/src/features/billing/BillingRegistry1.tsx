import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import BillingMeter from './BillingMeter';
import ProfileNavBar1 from '../profile/ProfileNavBar1';

interface BillingRegistry1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface BillingRegistry1ContextValue {
  state: BillingRegistry1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const BillingRegistry1Context = createContext<BillingRegistry1ContextValue | null>(null);

export function useBillingRegistry1() {
  const ctx = useContext(BillingRegistry1Context);
  if (!ctx) {
    throw new Error(`useBillingRegistry1 must be used within a BillingRegistry1`);
  }
  return ctx;
}

interface BillingRegistry1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function BillingRegistry1({
  children,
  initialActive = false,
  initialLabel = 'BillingRegistry1',
}: BillingRegistry1Props) {
  const [state, setState] = useState<BillingRegistry1State>({
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

  const contextValue = useMemo<BillingRegistry1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <BillingRegistry1Context.Provider value={contextValue}>
      {children}
      <BillingMeter />
      <ProfileNavBar1 />
    </BillingRegistry1Context.Provider>
  );
}
