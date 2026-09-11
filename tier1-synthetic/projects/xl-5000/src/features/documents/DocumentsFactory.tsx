import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import DocumentsHeader from './DocumentsHeader';

interface DocumentsFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface DocumentsFactoryContextValue {
  state: DocumentsFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const DocumentsFactoryContext = createContext<DocumentsFactoryContextValue | null>(null);

export function useDocumentsFactory() {
  const ctx = useContext(DocumentsFactoryContext);
  if (!ctx) {
    throw new Error(`useDocumentsFactory must be used within a DocumentsFactory`);
  }
  return ctx;
}

interface DocumentsFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function DocumentsFactory({
  children,
  initialActive = false,
  initialLabel = 'DocumentsFactory',
}: DocumentsFactoryProps) {
  const [state, setState] = useState<DocumentsFactoryState>({
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

  const contextValue = useMemo<DocumentsFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <DocumentsFactoryContext.Provider value={contextValue}>
      {children}
      <DocumentsHeader />
    </DocumentsFactoryContext.Provider>
  );
}
