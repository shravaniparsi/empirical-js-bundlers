import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AdminProgress from './AdminProgress';
import AdminPreview from './AdminPreview';
import AdminCard from './AdminCard';

interface AdminWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AdminWrapperContextValue {
  state: AdminWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AdminWrapperContext = createContext<AdminWrapperContextValue | null>(null);

export function useAdminWrapper() {
  const ctx = useContext(AdminWrapperContext);
  if (!ctx) {
    throw new Error(`useAdminWrapper must be used within a AdminWrapper`);
  }
  return ctx;
}

interface AdminWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AdminWrapper({
  children,
  initialActive = false,
  initialLabel = 'AdminWrapper',
}: AdminWrapperProps) {
  const [state, setState] = useState<AdminWrapperState>({
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

  const contextValue = useMemo<AdminWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AdminWrapperContext.Provider value={contextValue}>
      {children}
      <AdminProgress />
      <AdminPreview />
      <AdminCard />
    </AdminWrapperContext.Provider>
  );
}
