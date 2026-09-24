import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import UsersDrawer1 from './UsersDrawer1';
import AnalyticsList from '../analytics/AnalyticsList';
import ReviewsSidebar from '../reviews/ReviewsSidebar';

interface UsersRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface UsersRegistryContextValue {
  state: UsersRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const UsersRegistryContext = createContext<UsersRegistryContextValue | null>(null);

export function useUsersRegistry() {
  const ctx = useContext(UsersRegistryContext);
  if (!ctx) {
    throw new Error(`useUsersRegistry must be used within a UsersRegistry`);
  }
  return ctx;
}

interface UsersRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function UsersRegistry({
  children,
  initialActive = false,
  initialLabel = 'UsersRegistry',
}: UsersRegistryProps) {
  const [state, setState] = useState<UsersRegistryState>({
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

  const contextValue = useMemo<UsersRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <UsersRegistryContext.Provider value={contextValue}>
      {children}
      <UsersDrawer1 />
      <AnalyticsList />
      <ReviewsSidebar />
    </UsersRegistryContext.Provider>
  );
}
