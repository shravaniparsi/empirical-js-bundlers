import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import WebhooksPreview from './WebhooksPreview';

interface WebhooksHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface WebhooksHOCContextValue {
  state: WebhooksHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const WebhooksHOCContext = createContext<WebhooksHOCContextValue | null>(null);

export function useWebhooksHOC() {
  const ctx = useContext(WebhooksHOCContext);
  if (!ctx) {
    throw new Error(`useWebhooksHOC must be used within a WebhooksHOC`);
  }
  return ctx;
}

interface WebhooksHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function WebhooksHOC({
  children,
  initialActive = false,
  initialLabel = 'WebhooksHOC',
}: WebhooksHOCProps) {
  const [state, setState] = useState<WebhooksHOCState>({
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

  const contextValue = useMemo<WebhooksHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <WebhooksHOCContext.Provider value={contextValue}>
      {children}
      <WebhooksPreview />
    </WebhooksHOCContext.Provider>
  );
}
