import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AuditTag1 from './AuditTag1';
import AuditDrawer from './AuditDrawer';

interface AuditProvider1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AuditProvider1ContextValue {
  state: AuditProvider1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AuditProvider1Context = createContext<AuditProvider1ContextValue | null>(null);

export function useAuditProvider1() {
  const ctx = useContext(AuditProvider1Context);
  if (!ctx) {
    throw new Error(`useAuditProvider1 must be used within a AuditProvider1`);
  }
  return ctx;
}

interface AuditProvider1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AuditProvider1({
  children,
  initialActive = false,
  initialLabel = 'AuditProvider1',
}: AuditProvider1Props) {
  const [state, setState] = useState<AuditProvider1State>({
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

  const contextValue = useMemo<AuditProvider1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AuditProvider1Context.Provider value={contextValue}>
      {children}
      <AuditTag1 />
      <AuditDrawer />
    </AuditProvider1Context.Provider>
  );
}
