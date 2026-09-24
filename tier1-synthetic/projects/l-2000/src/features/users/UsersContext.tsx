import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import UsersSnackbar from './UsersSnackbar';
import ProfileProvider from '../profile/ProfileProvider';

interface UsersContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface UsersContextContextValue {
  state: UsersContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const UsersContextContext = createContext<UsersContextContextValue | null>(null);

export function useUsersContext() {
  const ctx = useContext(UsersContextContext);
  if (!ctx) {
    throw new Error(`useUsersContext must be used within a UsersContext`);
  }
  return ctx;
}

interface UsersContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function UsersContext({
  children,
  initialActive = false,
  initialLabel = 'UsersContext',
}: UsersContextProps) {
  const [state, setState] = useState<UsersContextState>({
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

  const contextValue = useMemo<UsersContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <UsersContextContext.Provider value={contextValue}>
      {children}
      <UsersSnackbar />
      <ProfileProvider />
    </UsersContextContext.Provider>
  );
}
