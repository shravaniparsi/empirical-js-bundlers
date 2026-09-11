import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import NotificationsDivider from './NotificationsDivider';
import NotificationsPanel1 from './NotificationsPanel1';

interface NotificationsAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface NotificationsAdapterContextValue {
  state: NotificationsAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const NotificationsAdapterContext = createContext<NotificationsAdapterContextValue | null>(null);

export function useNotificationsAdapter() {
  const ctx = useContext(NotificationsAdapterContext);
  if (!ctx) {
    throw new Error(`useNotificationsAdapter must be used within a NotificationsAdapter`);
  }
  return ctx;
}

interface NotificationsAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function NotificationsAdapter({
  children,
  initialActive = false,
  initialLabel = 'NotificationsAdapter',
}: NotificationsAdapterProps) {
  const [state, setState] = useState<NotificationsAdapterState>({
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

  const contextValue = useMemo<NotificationsAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <NotificationsAdapterContext.Provider value={contextValue}>
      {children}
      <NotificationsDivider />
      <NotificationsPanel1 />
    </NotificationsAdapterContext.Provider>
  );
}
