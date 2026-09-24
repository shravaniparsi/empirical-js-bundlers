import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import NotificationsAccordion from './NotificationsAccordion';
import ReviewsSpacer1 from '../reviews/ReviewsSpacer1';
import TasksPaginated1 from '../tasks/TasksPaginated1';

interface NotificationsAdapter1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface NotificationsAdapter1ContextValue {
  state: NotificationsAdapter1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const NotificationsAdapter1Context = createContext<NotificationsAdapter1ContextValue | null>(null);

export function useNotificationsAdapter1() {
  const ctx = useContext(NotificationsAdapter1Context);
  if (!ctx) {
    throw new Error(`useNotificationsAdapter1 must be used within a NotificationsAdapter1`);
  }
  return ctx;
}

interface NotificationsAdapter1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function NotificationsAdapter1({
  children,
  initialActive = false,
  initialLabel = 'NotificationsAdapter1',
}: NotificationsAdapter1Props) {
  const [state, setState] = useState<NotificationsAdapter1State>({
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

  const contextValue = useMemo<NotificationsAdapter1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <NotificationsAdapter1Context.Provider value={contextValue}>
      {children}
      <NotificationsAccordion />
      <ReviewsSpacer1 />
      <TasksPaginated1 />
    </NotificationsAdapter1Context.Provider>
  );
}
