import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import WebhooksDetail from './WebhooksDetail';
import WebhooksAlert from './WebhooksAlert';
import ReportsMeter1 from '../reports/ReportsMeter1';

interface WebhooksComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface WebhooksComposerContextValue {
  state: WebhooksComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const WebhooksComposerContext = createContext<WebhooksComposerContextValue | null>(null);

export function useWebhooksComposer() {
  const ctx = useContext(WebhooksComposerContext);
  if (!ctx) {
    throw new Error(`useWebhooksComposer must be used within a WebhooksComposer`);
  }
  return ctx;
}

interface WebhooksComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function WebhooksComposer({
  children,
  initialActive = false,
  initialLabel = 'WebhooksComposer',
}: WebhooksComposerProps) {
  const [state, setState] = useState<WebhooksComposerState>({
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

  const contextValue = useMemo<WebhooksComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <WebhooksComposerContext.Provider value={contextValue}>
      {children}
      <WebhooksDetail />
      <WebhooksAlert />
      <ReportsMeter1 />
    </WebhooksComposerContext.Provider>
  );
}
