import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import WebhooksFeed from './WebhooksFeed';
import WebhooksTabs1 from './WebhooksTabs1';

interface WebhooksContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface WebhooksContextContextValue {
  state: WebhooksContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const WebhooksContextContext = createContext<WebhooksContextContextValue | null>(null);

export function useWebhooksContext() {
  const ctx = useContext(WebhooksContextContext);
  if (!ctx) {
    throw new Error(`useWebhooksContext must be used within a WebhooksContext`);
  }
  return ctx;
}

interface WebhooksContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function WebhooksContext({
  children,
  initialActive = false,
  initialLabel = 'WebhooksContext',
}: WebhooksContextProps) {
  const [state, setState] = useState<WebhooksContextState>({
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

  const contextValue = useMemo<WebhooksContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <WebhooksContextContext.Provider value={contextValue}>
      {children}
      <WebhooksFeed />
      <WebhooksTabs1 />
    </WebhooksContextContext.Provider>
  );
}
