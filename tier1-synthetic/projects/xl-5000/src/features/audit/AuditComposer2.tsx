import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AuditCheckbox from './AuditCheckbox';
import AuditFunnel from './AuditFunnel';

interface AuditComposer2State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AuditComposer2ContextValue {
  state: AuditComposer2State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AuditComposer2Context = createContext<AuditComposer2ContextValue | null>(null);

export function useAuditComposer2() {
  const ctx = useContext(AuditComposer2Context);
  if (!ctx) {
    throw new Error(`useAuditComposer2 must be used within a AuditComposer2`);
  }
  return ctx;
}

interface AuditComposer2Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AuditComposer2({
  children,
  initialActive = false,
  initialLabel = 'AuditComposer2',
}: AuditComposer2Props) {
  const [state, setState] = useState<AuditComposer2State>({
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

  const contextValue = useMemo<AuditComposer2ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AuditComposer2Context.Provider value={contextValue}>
      {children}
      <AuditCheckbox />
      <AuditFunnel />
    </AuditComposer2Context.Provider>
  );
}
