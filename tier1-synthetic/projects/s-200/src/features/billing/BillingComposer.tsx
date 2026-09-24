import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import BillingNotification from './BillingNotification';
import BillingPlaceholder from './BillingPlaceholder';

interface BillingComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface BillingComposerContextValue {
  state: BillingComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const BillingComposerContext = createContext<BillingComposerContextValue | null>(null);

export function useBillingComposer() {
  const ctx = useContext(BillingComposerContext);
  if (!ctx) {
    throw new Error(`useBillingComposer must be used within a BillingComposer`);
  }
  return ctx;
}

interface BillingComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function BillingComposer({
  children,
  initialActive = false,
  initialLabel = 'BillingComposer',
}: BillingComposerProps) {
  const [state, setState] = useState<BillingComposerState>({
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

  const contextValue = useMemo<BillingComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <BillingComposerContext.Provider value={contextValue}>
      {children}
      <BillingNotification />
      <BillingPlaceholder />
    </BillingComposerContext.Provider>
  );
}
