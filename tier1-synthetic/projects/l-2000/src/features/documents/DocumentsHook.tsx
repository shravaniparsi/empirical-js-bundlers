import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import DocumentsGauge from './DocumentsGauge';
import DocumentsThumbnail1 from './DocumentsThumbnail1';
import DocumentsSelect from './DocumentsSelect';
import WebhooksRegistry from '../webhooks/WebhooksRegistry';
import WebhooksSticky from '../webhooks/WebhooksSticky';

interface DocumentsHookState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface DocumentsHookContextValue {
  state: DocumentsHookState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const DocumentsHookContext = createContext<DocumentsHookContextValue | null>(null);

export function useDocumentsHook() {
  const ctx = useContext(DocumentsHookContext);
  if (!ctx) {
    throw new Error(`useDocumentsHook must be used within a DocumentsHook`);
  }
  return ctx;
}

interface DocumentsHookProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function DocumentsHook({
  children,
  initialActive = false,
  initialLabel = 'DocumentsHook',
}: DocumentsHookProps) {
  const [state, setState] = useState<DocumentsHookState>({
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

  const contextValue = useMemo<DocumentsHookContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <DocumentsHookContext.Provider value={contextValue}>
      {children}
      <DocumentsGauge />
      <DocumentsThumbnail1 />
      <DocumentsSelect />
      <WebhooksRegistry />
      <WebhooksSticky />
    </DocumentsHookContext.Provider>
  );
}
