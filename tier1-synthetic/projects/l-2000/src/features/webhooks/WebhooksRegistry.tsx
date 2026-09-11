import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import WebhooksSparkline from './WebhooksSparkline';

interface WebhooksRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface WebhooksRegistryContextValue {
  state: WebhooksRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const WebhooksRegistryContext = createContext<WebhooksRegistryContextValue | null>(null);

export function useWebhooksRegistry() {
  const ctx = useContext(WebhooksRegistryContext);
  if (!ctx) {
    throw new Error(`useWebhooksRegistry must be used within a WebhooksRegistry`);
  }
  return ctx;
}

interface WebhooksRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function WebhooksRegistry({
  children,
  initialActive = false,
  initialLabel = 'WebhooksRegistry',
}: WebhooksRegistryProps) {
  const [state, setState] = useState<WebhooksRegistryState>({
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

  const contextValue = useMemo<WebhooksRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <WebhooksRegistryContext.Provider value={contextValue}>
      {children}
      <WebhooksSparkline />
    </WebhooksRegistryContext.Provider>
  );
}
