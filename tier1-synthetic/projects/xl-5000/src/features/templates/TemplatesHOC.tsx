import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SettingsCard3 from '../settings/SettingsCard3';
import OrdersHeatmap1 from '../orders/OrdersHeatmap1';

interface TemplatesHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TemplatesHOCContextValue {
  state: TemplatesHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TemplatesHOCContext = createContext<TemplatesHOCContextValue | null>(null);

export function useTemplatesHOC() {
  const ctx = useContext(TemplatesHOCContext);
  if (!ctx) {
    throw new Error(`useTemplatesHOC must be used within a TemplatesHOC`);
  }
  return ctx;
}

interface TemplatesHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TemplatesHOC({
  children,
  initialActive = false,
  initialLabel = 'TemplatesHOC',
}: TemplatesHOCProps) {
  const [state, setState] = useState<TemplatesHOCState>({
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

  const contextValue = useMemo<TemplatesHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TemplatesHOCContext.Provider value={contextValue}>
      {children}
      <SettingsCard3 />
      <OrdersHeatmap1 />
    </TemplatesHOCContext.Provider>
  );
}
