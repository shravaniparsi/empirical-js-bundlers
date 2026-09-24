import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ProductsNotification1 from '../products/ProductsNotification1';

interface SupportFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SupportFactoryContextValue {
  state: SupportFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SupportFactoryContext = createContext<SupportFactoryContextValue | null>(null);

export function useSupportFactory() {
  const ctx = useContext(SupportFactoryContext);
  if (!ctx) {
    throw new Error(`useSupportFactory must be used within a SupportFactory`);
  }
  return ctx;
}

interface SupportFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SupportFactory({
  children,
  initialActive = false,
  initialLabel = 'SupportFactory',
}: SupportFactoryProps) {
  const [state, setState] = useState<SupportFactoryState>({
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

  const contextValue = useMemo<SupportFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SupportFactoryContext.Provider value={contextValue}>
      {children}
      <ProductsNotification1 />
    </SupportFactoryContext.Provider>
  );
}
