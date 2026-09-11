import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import UsersInfiniteScroll from './UsersInfiniteScroll';
import UsersSparkline from './UsersSparkline';
import SearchDrawer from '../search/SearchDrawer';

interface UsersAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface UsersAdapterContextValue {
  state: UsersAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const UsersAdapterContext = createContext<UsersAdapterContextValue | null>(null);

export function useUsersAdapter() {
  const ctx = useContext(UsersAdapterContext);
  if (!ctx) {
    throw new Error(`useUsersAdapter must be used within a UsersAdapter`);
  }
  return ctx;
}

interface UsersAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function UsersAdapter({
  children,
  initialActive = false,
  initialLabel = 'UsersAdapter',
}: UsersAdapterProps) {
  const [state, setState] = useState<UsersAdapterState>({
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

  const contextValue = useMemo<UsersAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <UsersAdapterContext.Provider value={contextValue}>
      {children}
      <UsersInfiniteScroll />
      <UsersSparkline />
      <SearchDrawer />
    </UsersAdapterContext.Provider>
  );
}
