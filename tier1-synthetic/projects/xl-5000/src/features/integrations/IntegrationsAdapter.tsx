import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface IntegrationsAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface IntegrationsAdapterContextValue {
  state: IntegrationsAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const IntegrationsAdapterContext = createContext<IntegrationsAdapterContextValue | null>(null);

export function useIntegrationsAdapter() {
  const ctx = useContext(IntegrationsAdapterContext);
  if (!ctx) {
    throw new Error(`useIntegrationsAdapter must be used within a IntegrationsAdapter`);
  }
  return ctx;
}

interface IntegrationsAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function IntegrationsAdapter({
  children,
  initialActive = false,
  initialLabel = 'IntegrationsAdapter',
}: IntegrationsAdapterProps) {
  const [state, setState] = useState<IntegrationsAdapterState>({
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

  const contextValue = useMemo<IntegrationsAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <IntegrationsAdapterContext.Provider value={contextValue}>
      {children}

    </IntegrationsAdapterContext.Provider>
  );
}
