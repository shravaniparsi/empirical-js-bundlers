import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import UsersFileUpload from './UsersFileUpload';
import SearchScroll1 from '../search/SearchScroll1';
import NotificationsScore from '../notifications/NotificationsScore';

interface UsersWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface UsersWrapperContextValue {
  state: UsersWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const UsersWrapperContext = createContext<UsersWrapperContextValue | null>(null);

export function useUsersWrapper() {
  const ctx = useContext(UsersWrapperContext);
  if (!ctx) {
    throw new Error(`useUsersWrapper must be used within a UsersWrapper`);
  }
  return ctx;
}

interface UsersWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function UsersWrapper({
  children,
  initialActive = false,
  initialLabel = 'UsersWrapper',
}: UsersWrapperProps) {
  const [state, setState] = useState<UsersWrapperState>({
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

  const contextValue = useMemo<UsersWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <UsersWrapperContext.Provider value={contextValue}>
      {children}
      <UsersFileUpload />
      <SearchScroll1 />
      <NotificationsScore />
    </UsersWrapperContext.Provider>
  );
}
