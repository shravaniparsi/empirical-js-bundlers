import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AdminHeader from './AdminHeader';
import AdminTooltip3 from './AdminTooltip3';
import AdminTooltip1 from './AdminTooltip1';

interface AdminContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AdminContextContextValue {
  state: AdminContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AdminContextContext = createContext<AdminContextContextValue | null>(null);

export function useAdminContext() {
  const ctx = useContext(AdminContextContext);
  if (!ctx) {
    throw new Error(`useAdminContext must be used within a AdminContext`);
  }
  return ctx;
}

interface AdminContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AdminContext({
  children,
  initialActive = false,
  initialLabel = 'AdminContext',
}: AdminContextProps) {
  const [state, setState] = useState<AdminContextState>({
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

  const contextValue = useMemo<AdminContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AdminContextContext.Provider value={contextValue}>
      {children}
      <AdminHeader />
      <AdminTooltip3 />
      <AdminTooltip1 />
    </AdminContextContext.Provider>
  );
}
