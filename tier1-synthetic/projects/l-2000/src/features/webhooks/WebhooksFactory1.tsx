import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import WebhooksSpacer from './WebhooksSpacer';

interface WebhooksFactory1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface WebhooksFactory1ContextValue {
  state: WebhooksFactory1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const WebhooksFactory1Context = createContext<WebhooksFactory1ContextValue | null>(null);

export function useWebhooksFactory1() {
  const ctx = useContext(WebhooksFactory1Context);
  if (!ctx) {
    throw new Error(`useWebhooksFactory1 must be used within a WebhooksFactory1`);
  }
  return ctx;
}

interface WebhooksFactory1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function WebhooksFactory1({
  children,
  initialActive = false,
  initialLabel = 'WebhooksFactory1',
}: WebhooksFactory1Props) {
  const [state, setState] = useState<WebhooksFactory1State>({
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

  const contextValue = useMemo<WebhooksFactory1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <WebhooksFactory1Context.Provider value={contextValue}>
      {children}
      <WebhooksSpacer />
    </WebhooksFactory1Context.Provider>
  );
}
