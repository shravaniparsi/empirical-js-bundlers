import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import DocumentsPagination from './DocumentsPagination';

interface DocumentsWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface DocumentsWrapperContextValue {
  state: DocumentsWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const DocumentsWrapperContext = createContext<DocumentsWrapperContextValue | null>(null);

export function useDocumentsWrapper() {
  const ctx = useContext(DocumentsWrapperContext);
  if (!ctx) {
    throw new Error(`useDocumentsWrapper must be used within a DocumentsWrapper`);
  }
  return ctx;
}

interface DocumentsWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function DocumentsWrapper({
  children,
  initialActive = false,
  initialLabel = 'DocumentsWrapper',
}: DocumentsWrapperProps) {
  const [state, setState] = useState<DocumentsWrapperState>({
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

  const contextValue = useMemo<DocumentsWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <DocumentsWrapperContext.Provider value={contextValue}>
      {children}
      <DocumentsPagination />
    </DocumentsWrapperContext.Provider>
  );
}
