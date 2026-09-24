import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import IntegrationsToast from './IntegrationsToast';
import IntegrationsSpacer1 from './IntegrationsSpacer1';
import IntegrationsPopover1 from './IntegrationsPopover1';

interface IntegrationsWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface IntegrationsWrapperContextValue {
  state: IntegrationsWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const IntegrationsWrapperContext = createContext<IntegrationsWrapperContextValue | null>(null);

export function useIntegrationsWrapper() {
  const ctx = useContext(IntegrationsWrapperContext);
  if (!ctx) {
    throw new Error(`useIntegrationsWrapper must be used within a IntegrationsWrapper`);
  }
  return ctx;
}

interface IntegrationsWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function IntegrationsWrapper({
  children,
  initialActive = false,
  initialLabel = 'IntegrationsWrapper',
}: IntegrationsWrapperProps) {
  const [state, setState] = useState<IntegrationsWrapperState>({
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

  const contextValue = useMemo<IntegrationsWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <IntegrationsWrapperContext.Provider value={contextValue}>
      {children}
      <IntegrationsToast />
      <IntegrationsSpacer1 />
      <IntegrationsPopover1 />
    </IntegrationsWrapperContext.Provider>
  );
}
