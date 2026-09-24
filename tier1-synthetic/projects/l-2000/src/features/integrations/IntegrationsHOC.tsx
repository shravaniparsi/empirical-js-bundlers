import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import IntegrationsNavBar1 from './IntegrationsNavBar1';
import IntegrationsRating from './IntegrationsRating';

interface IntegrationsHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface IntegrationsHOCContextValue {
  state: IntegrationsHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const IntegrationsHOCContext = createContext<IntegrationsHOCContextValue | null>(null);

export function useIntegrationsHOC() {
  const ctx = useContext(IntegrationsHOCContext);
  if (!ctx) {
    throw new Error(`useIntegrationsHOC must be used within a IntegrationsHOC`);
  }
  return ctx;
}

interface IntegrationsHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function IntegrationsHOC({
  children,
  initialActive = false,
  initialLabel = 'IntegrationsHOC',
}: IntegrationsHOCProps) {
  const [state, setState] = useState<IntegrationsHOCState>({
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

  const contextValue = useMemo<IntegrationsHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <IntegrationsHOCContext.Provider value={contextValue}>
      {children}
      <IntegrationsNavBar1 />
      <IntegrationsRating />
    </IntegrationsHOCContext.Provider>
  );
}
