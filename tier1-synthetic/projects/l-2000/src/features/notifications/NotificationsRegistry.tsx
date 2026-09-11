import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import NotificationsHOC from './NotificationsHOC';

interface NotificationsRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface NotificationsRegistryContextValue {
  state: NotificationsRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const NotificationsRegistryContext = createContext<NotificationsRegistryContextValue | null>(null);

export function useNotificationsRegistry() {
  const ctx = useContext(NotificationsRegistryContext);
  if (!ctx) {
    throw new Error(`useNotificationsRegistry must be used within a NotificationsRegistry`);
  }
  return ctx;
}

interface NotificationsRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function NotificationsRegistry({
  children,
  initialActive = false,
  initialLabel = 'NotificationsRegistry',
}: NotificationsRegistryProps) {
  const [state, setState] = useState<NotificationsRegistryState>({
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

  const contextValue = useMemo<NotificationsRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <NotificationsRegistryContext.Provider value={contextValue}>
      {children}
      <NotificationsHOC />
    </NotificationsRegistryContext.Provider>
  );
}
