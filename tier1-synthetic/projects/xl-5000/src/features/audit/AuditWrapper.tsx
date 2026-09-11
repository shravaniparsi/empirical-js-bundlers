import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AuditTimeline from './AuditTimeline';
import AuditCollapse1 from './AuditCollapse1';

interface AuditWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AuditWrapperContextValue {
  state: AuditWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AuditWrapperContext = createContext<AuditWrapperContextValue | null>(null);

export function useAuditWrapper() {
  const ctx = useContext(AuditWrapperContext);
  if (!ctx) {
    throw new Error(`useAuditWrapper must be used within a AuditWrapper`);
  }
  return ctx;
}

interface AuditWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AuditWrapper({
  children,
  initialActive = false,
  initialLabel = 'AuditWrapper',
}: AuditWrapperProps) {
  const [state, setState] = useState<AuditWrapperState>({
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

  const contextValue = useMemo<AuditWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AuditWrapperContext.Provider value={contextValue}>
      {children}
      <AuditTimeline />
      <AuditCollapse1 />
    </AuditWrapperContext.Provider>
  );
}
