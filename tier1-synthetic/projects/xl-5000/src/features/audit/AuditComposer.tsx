import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AuditGrid from './AuditGrid';
import AuditSidebar from './AuditSidebar';
import AuditAlert from './AuditAlert';

interface AuditComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AuditComposerContextValue {
  state: AuditComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AuditComposerContext = createContext<AuditComposerContextValue | null>(null);

export function useAuditComposer() {
  const ctx = useContext(AuditComposerContext);
  if (!ctx) {
    throw new Error(`useAuditComposer must be used within a AuditComposer`);
  }
  return ctx;
}

interface AuditComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AuditComposer({
  children,
  initialActive = false,
  initialLabel = 'AuditComposer',
}: AuditComposerProps) {
  const [state, setState] = useState<AuditComposerState>({
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

  const contextValue = useMemo<AuditComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AuditComposerContext.Provider value={contextValue}>
      {children}
      <AuditGrid />
      <AuditSidebar />
      <AuditAlert />
    </AuditComposerContext.Provider>
  );
}
