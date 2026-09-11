import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SupportScatter from './SupportScatter';
import SupportFooter1 from './SupportFooter1';
import SupportDivider from './SupportDivider';

interface SupportBridgeState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface SupportBridgeContextValue {
  state: SupportBridgeState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const SupportBridgeContext = createContext<SupportBridgeContextValue | null>(null);

export function useSupportBridge() {
  const ctx = useContext(SupportBridgeContext);
  if (!ctx) {
    throw new Error(`useSupportBridge must be used within a SupportBridge`);
  }
  return ctx;
}

interface SupportBridgeProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function SupportBridge({
  children,
  initialActive = false,
  initialLabel = 'SupportBridge',
}: SupportBridgeProps) {
  const [state, setState] = useState<SupportBridgeState>({
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

  const contextValue = useMemo<SupportBridgeContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <SupportBridgeContext.Provider value={contextValue}>
      {children}
      <SupportScatter />
      <SupportFooter1 />
      <SupportDivider />
    </SupportBridgeContext.Provider>
  );
}
