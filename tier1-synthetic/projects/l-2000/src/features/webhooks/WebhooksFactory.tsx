import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import WebhooksPlaceholder from './WebhooksPlaceholder';

interface WebhooksFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface WebhooksFactoryContextValue {
  state: WebhooksFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const WebhooksFactoryContext = createContext<WebhooksFactoryContextValue | null>(null);

export function useWebhooksFactory() {
  const ctx = useContext(WebhooksFactoryContext);
  if (!ctx) {
    throw new Error(`useWebhooksFactory must be used within a WebhooksFactory`);
  }
  return ctx;
}

interface WebhooksFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function WebhooksFactory({
  children,
  initialActive = false,
  initialLabel = 'WebhooksFactory',
}: WebhooksFactoryProps) {
  const [state, setState] = useState<WebhooksFactoryState>({
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

  const contextValue = useMemo<WebhooksFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <WebhooksFactoryContext.Provider value={contextValue}>
      {children}
      <WebhooksPlaceholder />
    </WebhooksFactoryContext.Provider>
  );
}
