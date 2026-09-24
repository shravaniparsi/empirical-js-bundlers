import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import NotificationsNotification from './NotificationsNotification';
import NotificationsToggle from './NotificationsToggle';
import NotificationsRangeSlider from './NotificationsRangeSlider';

interface NotificationsHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface NotificationsHOCContextValue {
  state: NotificationsHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const NotificationsHOCContext = createContext<NotificationsHOCContextValue | null>(null);

export function useNotificationsHOC() {
  const ctx = useContext(NotificationsHOCContext);
  if (!ctx) {
    throw new Error(`useNotificationsHOC must be used within a NotificationsHOC`);
  }
  return ctx;
}

interface NotificationsHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function NotificationsHOC({
  children,
  initialActive = false,
  initialLabel = 'NotificationsHOC',
}: NotificationsHOCProps) {
  const [state, setState] = useState<NotificationsHOCState>({
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

  const contextValue = useMemo<NotificationsHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <NotificationsHOCContext.Provider value={contextValue}>
      {children}
      <NotificationsNotification />
      <NotificationsToggle />
      <NotificationsRangeSlider />
    </NotificationsHOCContext.Provider>
  );
}
