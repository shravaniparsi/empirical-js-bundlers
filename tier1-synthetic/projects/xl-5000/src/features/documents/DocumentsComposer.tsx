import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import DocumentsTreeView from './DocumentsTreeView';

interface DocumentsComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface DocumentsComposerContextValue {
  state: DocumentsComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const DocumentsComposerContext = createContext<DocumentsComposerContextValue | null>(null);

export function useDocumentsComposer() {
  const ctx = useContext(DocumentsComposerContext);
  if (!ctx) {
    throw new Error(`useDocumentsComposer must be used within a DocumentsComposer`);
  }
  return ctx;
}

interface DocumentsComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function DocumentsComposer({
  children,
  initialActive = false,
  initialLabel = 'DocumentsComposer',
}: DocumentsComposerProps) {
  const [state, setState] = useState<DocumentsComposerState>({
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

  const contextValue = useMemo<DocumentsComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <DocumentsComposerContext.Provider value={contextValue}>
      {children}
      <DocumentsTreeView />
    </DocumentsComposerContext.Provider>
  );
}
