import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import NotificationsCollapse from './NotificationsCollapse';

interface NotificationsComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface NotificationsComposerContextValue {
  state: NotificationsComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const NotificationsComposerContext = createContext<NotificationsComposerContextValue | null>(null);

export function useNotificationsComposer() {
  const ctx = useContext(NotificationsComposerContext);
  if (!ctx) {
    throw new Error(`useNotificationsComposer must be used within a NotificationsComposer`);
  }
  return ctx;
}

interface NotificationsComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function NotificationsComposer({
  children,
  initialActive = false,
  initialLabel = 'NotificationsComposer',
}: NotificationsComposerProps) {
  const [state, setState] = useState<NotificationsComposerState>({
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

  const contextValue = useMemo<NotificationsComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <NotificationsComposerContext.Provider value={contextValue}>
      {children}
      <NotificationsCollapse />
    </NotificationsComposerContext.Provider>
  );
}
