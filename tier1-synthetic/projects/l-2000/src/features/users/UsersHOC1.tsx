import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import UsersLoader from './UsersLoader';
import UsersBreadcrumb1 from './UsersBreadcrumb1';
import UsersSnackbar from './UsersSnackbar';

interface UsersHOC1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface UsersHOC1ContextValue {
  state: UsersHOC1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const UsersHOC1Context = createContext<UsersHOC1ContextValue | null>(null);

export function useUsersHOC1() {
  const ctx = useContext(UsersHOC1Context);
  if (!ctx) {
    throw new Error(`useUsersHOC1 must be used within a UsersHOC1`);
  }
  return ctx;
}

interface UsersHOC1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function UsersHOC1({
  children,
  initialActive = false,
  initialLabel = 'UsersHOC1',
}: UsersHOC1Props) {
  const [state, setState] = useState<UsersHOC1State>({
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

  const contextValue = useMemo<UsersHOC1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <UsersHOC1Context.Provider value={contextValue}>
      {children}
      <UsersLoader />
      <UsersBreadcrumb1 />
      <UsersSnackbar />
    </UsersHOC1Context.Provider>
  );
}
