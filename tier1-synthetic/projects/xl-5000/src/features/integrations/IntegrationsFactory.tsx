import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import IntegrationsStat from './IntegrationsStat';

interface IntegrationsFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface IntegrationsFactoryContextValue {
  state: IntegrationsFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const IntegrationsFactoryContext = createContext<IntegrationsFactoryContextValue | null>(null);

export function useIntegrationsFactory() {
  const ctx = useContext(IntegrationsFactoryContext);
  if (!ctx) {
    throw new Error(`useIntegrationsFactory must be used within a IntegrationsFactory`);
  }
  return ctx;
}

interface IntegrationsFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function IntegrationsFactory({
  children,
  initialActive = false,
  initialLabel = 'IntegrationsFactory',
}: IntegrationsFactoryProps) {
  const [state, setState] = useState<IntegrationsFactoryState>({
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

  const contextValue = useMemo<IntegrationsFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <IntegrationsFactoryContext.Provider value={contextValue}>
      {children}
      <IntegrationsStat />
    </IntegrationsFactoryContext.Provider>
  );
}
