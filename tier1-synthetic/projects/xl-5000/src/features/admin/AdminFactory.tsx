import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AdminDivider from './AdminDivider';
import AdminAreaChart from './AdminAreaChart';

interface AdminFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AdminFactoryContextValue {
  state: AdminFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AdminFactoryContext = createContext<AdminFactoryContextValue | null>(null);

export function useAdminFactory() {
  const ctx = useContext(AdminFactoryContext);
  if (!ctx) {
    throw new Error(`useAdminFactory must be used within a AdminFactory`);
  }
  return ctx;
}

interface AdminFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AdminFactory({
  children,
  initialActive = false,
  initialLabel = 'AdminFactory',
}: AdminFactoryProps) {
  const [state, setState] = useState<AdminFactoryState>({
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

  const contextValue = useMemo<AdminFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AdminFactoryContext.Provider value={contextValue}>
      {children}
      <AdminDivider />
      <AdminAreaChart />
    </AdminFactoryContext.Provider>
  );
}
