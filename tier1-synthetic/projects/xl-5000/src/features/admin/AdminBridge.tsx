import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import AdminErrorBoundary from './AdminErrorBoundary';
import CommentsResponsive1 from '../comments/CommentsResponsive1';

interface AdminBridgeState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface AdminBridgeContextValue {
  state: AdminBridgeState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const AdminBridgeContext = createContext<AdminBridgeContextValue | null>(null);

export function useAdminBridge() {
  const ctx = useContext(AdminBridgeContext);
  if (!ctx) {
    throw new Error(`useAdminBridge must be used within a AdminBridge`);
  }
  return ctx;
}

interface AdminBridgeProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function AdminBridge({
  children,
  initialActive = false,
  initialLabel = 'AdminBridge',
}: AdminBridgeProps) {
  const [state, setState] = useState<AdminBridgeState>({
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

  const contextValue = useMemo<AdminBridgeContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <AdminBridgeContext.Provider value={contextValue}>
      {children}
      <AdminErrorBoundary />
      <CommentsResponsive1 />
    </AdminBridgeContext.Provider>
  );
}
