import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import UsersMeter1 from './UsersMeter1';
import UsersSuspense from './UsersSuspense';

interface UsersHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface UsersHOCContextValue {
  state: UsersHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const UsersHOCContext = createContext<UsersHOCContextValue | null>(null);

export function useUsersHOC() {
  const ctx = useContext(UsersHOCContext);
  if (!ctx) {
    throw new Error(`useUsersHOC must be used within a UsersHOC`);
  }
  return ctx;
}

interface UsersHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function UsersHOC({
  children,
  initialActive = false,
  initialLabel = 'UsersHOC',
}: UsersHOCProps) {
  const [state, setState] = useState<UsersHOCState>({
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

  const contextValue = useMemo<UsersHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <UsersHOCContext.Provider value={contextValue}>
      {children}
      <UsersMeter1 />
      <UsersSuspense />
    </UsersHOCContext.Provider>
  );
}
