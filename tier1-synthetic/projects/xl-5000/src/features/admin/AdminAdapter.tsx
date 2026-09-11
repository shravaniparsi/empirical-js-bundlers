import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AdminHeader1 from './AdminHeader1';
import AdminList from './AdminList';

interface AdminAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AdminAdapterContextValue {
  state: AdminAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AdminAdapterContext = createContext<AdminAdapterContextValue | null>(null);

export function useAdminAdapter() {
  const ctx = useContext(AdminAdapterContext);
  if (!ctx) {
    throw new Error(`useAdminAdapter must be used within a AdminAdapter`);
  }
  return ctx;
}

interface AdminAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AdminAdapter({
  children,
  initialActive = false,
  initialLabel = 'AdminAdapter',
}: AdminAdapterProps) {
  const [state, setState] = useState<AdminAdapterState>({
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

  const contextValue = useMemo<AdminAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AdminAdapterContext.Provider value={contextValue}>
      {children}
      <AdminHeader1 />
      <AdminList />
    </AdminAdapterContext.Provider>
  );
}
