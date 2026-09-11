import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AdminSummary from './AdminSummary';

interface AdminComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AdminComposerContextValue {
  state: AdminComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AdminComposerContext = createContext<AdminComposerContextValue | null>(null);

export function useAdminComposer() {
  const ctx = useContext(AdminComposerContext);
  if (!ctx) {
    throw new Error(`useAdminComposer must be used within a AdminComposer`);
  }
  return ctx;
}

interface AdminComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AdminComposer({
  children,
  initialActive = false,
  initialLabel = 'AdminComposer',
}: AdminComposerProps) {
  const [state, setState] = useState<AdminComposerState>({
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

  const contextValue = useMemo<AdminComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AdminComposerContext.Provider value={contextValue}>
      {children}
      <AdminSummary />
    </AdminComposerContext.Provider>
  );
}
