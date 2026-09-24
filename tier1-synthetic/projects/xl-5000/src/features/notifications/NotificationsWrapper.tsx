import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import NotificationsLoader from './NotificationsLoader';
import NotificationsSnackbar from './NotificationsSnackbar';
import NotificationsAreaChart2 from './NotificationsAreaChart2';
import ReportsSpinner1 from '../reports/ReportsSpinner1';

interface NotificationsWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface NotificationsWrapperContextValue {
  state: NotificationsWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const NotificationsWrapperContext = createContext<NotificationsWrapperContextValue | null>(null);

export function useNotificationsWrapper() {
  const ctx = useContext(NotificationsWrapperContext);
  if (!ctx) {
    throw new Error(`useNotificationsWrapper must be used within a NotificationsWrapper`);
  }
  return ctx;
}

interface NotificationsWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function NotificationsWrapper({
  children,
  initialActive = false,
  initialLabel = 'NotificationsWrapper',
}: NotificationsWrapperProps) {
  const [state, setState] = useState<NotificationsWrapperState>({
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

  const contextValue = useMemo<NotificationsWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <NotificationsWrapperContext.Provider value={contextValue}>
      {children}
      <NotificationsLoader />
      <NotificationsSnackbar />
      <NotificationsAreaChart2 />
      <ReportsSpinner1 />
    </NotificationsWrapperContext.Provider>
  );
}
