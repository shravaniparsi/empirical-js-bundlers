import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import NotificationsScore1 from './NotificationsScore1';
import NotificationsTimePicker from './NotificationsTimePicker';
import NotificationsRank from './NotificationsRank';

interface NotificationsContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface NotificationsContextContextValue {
  state: NotificationsContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const NotificationsContextContext = createContext<NotificationsContextContextValue | null>(null);

export function useNotificationsContext() {
  const ctx = useContext(NotificationsContextContext);
  if (!ctx) {
    throw new Error(`useNotificationsContext must be used within a NotificationsContext`);
  }
  return ctx;
}

interface NotificationsContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function NotificationsContext({
  children,
  initialActive = false,
  initialLabel = 'NotificationsContext',
}: NotificationsContextProps) {
  const [state, setState] = useState<NotificationsContextState>({
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

  const contextValue = useMemo<NotificationsContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <NotificationsContextContext.Provider value={contextValue}>
      {children}
      <NotificationsScore1 />
      <NotificationsTimePicker />
      <NotificationsRank />
    </NotificationsContextContext.Provider>
  );
}
