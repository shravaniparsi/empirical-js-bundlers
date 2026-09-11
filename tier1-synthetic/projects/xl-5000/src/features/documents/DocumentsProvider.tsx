import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import DocumentsAvatar from './DocumentsAvatar';

interface DocumentsProviderState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface DocumentsProviderContextValue {
  state: DocumentsProviderState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const DocumentsProviderContext = createContext<DocumentsProviderContextValue | null>(null);

export function useDocumentsProvider() {
  const ctx = useContext(DocumentsProviderContext);
  if (!ctx) {
    throw new Error(`useDocumentsProvider must be used within a DocumentsProvider`);
  }
  return ctx;
}

interface DocumentsProviderProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function DocumentsProvider({
  children,
  initialActive = false,
  initialLabel = 'DocumentsProvider',
}: DocumentsProviderProps) {
  const [state, setState] = useState<DocumentsProviderState>({
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

  const contextValue = useMemo<DocumentsProviderContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <DocumentsProviderContext.Provider value={contextValue}>
      {children}
      <DocumentsAvatar />
    </DocumentsProviderContext.Provider>
  );
}
