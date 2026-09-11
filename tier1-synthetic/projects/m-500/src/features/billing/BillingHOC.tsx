import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import BillingFactory from './BillingFactory';
import SearchDonut from '../search/SearchDonut';

interface BillingHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface BillingHOCContextValue {
  state: BillingHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const BillingHOCContext = createContext<BillingHOCContextValue | null>(null);

export function useBillingHOC() {
  const ctx = useContext(BillingHOCContext);
  if (!ctx) {
    throw new Error(`useBillingHOC must be used within a BillingHOC`);
  }
  return ctx;
}

interface BillingHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function BillingHOC({
  children,
  initialActive = false,
  initialLabel = 'BillingHOC',
}: BillingHOCProps) {
  const [state, setState] = useState<BillingHOCState>({
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

  const contextValue = useMemo<BillingHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <BillingHOCContext.Provider value={contextValue}>
      {children}
      <BillingFactory />
      <SearchDonut />
    </BillingHOCContext.Provider>
  );
}
