import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import DocumentsCollapse1 from './DocumentsCollapse1';

interface DocumentsHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface DocumentsHOCContextValue {
  state: DocumentsHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const DocumentsHOCContext = createContext<DocumentsHOCContextValue | null>(null);

export function useDocumentsHOC() {
  const ctx = useContext(DocumentsHOCContext);
  if (!ctx) {
    throw new Error(`useDocumentsHOC must be used within a DocumentsHOC`);
  }
  return ctx;
}

interface DocumentsHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function DocumentsHOC({
  children,
  initialActive = false,
  initialLabel = 'DocumentsHOC',
}: DocumentsHOCProps) {
  const [state, setState] = useState<DocumentsHOCState>({
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

  const contextValue = useMemo<DocumentsHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <DocumentsHOCContext.Provider value={contextValue}>
      {children}
      <DocumentsCollapse1 />
    </DocumentsHOCContext.Provider>
  );
}
