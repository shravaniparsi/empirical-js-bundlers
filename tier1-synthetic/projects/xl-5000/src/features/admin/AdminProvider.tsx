import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AdminLabel from './AdminLabel';
import ImportsRank from '../imports/ImportsRank';

interface AdminProviderState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AdminProviderContextValue {
  state: AdminProviderState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AdminProviderContext = createContext<AdminProviderContextValue | null>(null);

export function useAdminProvider() {
  const ctx = useContext(AdminProviderContext);
  if (!ctx) {
    throw new Error(`useAdminProvider must be used within a AdminProvider`);
  }
  return ctx;
}

interface AdminProviderProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AdminProvider({
  children,
  initialActive = false,
  initialLabel = 'AdminProvider',
}: AdminProviderProps) {
  const [state, setState] = useState<AdminProviderState>({
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

  const contextValue = useMemo<AdminProviderContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AdminProviderContext.Provider value={contextValue}>
      {children}
      <AdminLabel />
      <ImportsRank />
    </AdminProviderContext.Provider>
  );
}
