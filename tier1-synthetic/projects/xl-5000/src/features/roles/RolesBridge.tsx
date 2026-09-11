import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import RolesStepper from './RolesStepper';
import NotificationsAreaChart from '../notifications/NotificationsAreaChart';

interface RolesBridgeState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface RolesBridgeContextValue {
  state: RolesBridgeState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const RolesBridgeContext = createContext<RolesBridgeContextValue | null>(null);

export function useRolesBridge() {
  const ctx = useContext(RolesBridgeContext);
  if (!ctx) {
    throw new Error(`useRolesBridge must be used within a RolesBridge`);
  }
  return ctx;
}

interface RolesBridgeProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function RolesBridge({
  children,
  initialActive = false,
  initialLabel = 'RolesBridge',
}: RolesBridgeProps) {
  const [state, setState] = useState<RolesBridgeState>({
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

  const contextValue = useMemo<RolesBridgeContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <RolesBridgeContext.Provider value={contextValue}>
      {children}
      <RolesStepper />
      <NotificationsAreaChart />
    </RolesBridgeContext.Provider>
  );
}
