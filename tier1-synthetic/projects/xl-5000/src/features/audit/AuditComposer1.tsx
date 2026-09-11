import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AuditTimePicker from './AuditTimePicker';
import RolesRadio1 from '../roles/RolesRadio1';

interface AuditComposer1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AuditComposer1ContextValue {
  state: AuditComposer1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AuditComposer1Context = createContext<AuditComposer1ContextValue | null>(null);

export function useAuditComposer1() {
  const ctx = useContext(AuditComposer1Context);
  if (!ctx) {
    throw new Error(`useAuditComposer1 must be used within a AuditComposer1`);
  }
  return ctx;
}

interface AuditComposer1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AuditComposer1({
  children,
  initialActive = false,
  initialLabel = 'AuditComposer1',
}: AuditComposer1Props) {
  const [state, setState] = useState<AuditComposer1State>({
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

  const contextValue = useMemo<AuditComposer1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AuditComposer1Context.Provider value={contextValue}>
      {children}
      <AuditTimePicker />
      <RolesRadio1 />
    </AuditComposer1Context.Provider>
  );
}
