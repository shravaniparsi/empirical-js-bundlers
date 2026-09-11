import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SettingsCard3 from '../settings/SettingsCard3';

interface UsersRegistry1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface UsersRegistry1ContextValue {
  state: UsersRegistry1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const UsersRegistry1Context = createContext<UsersRegistry1ContextValue | null>(null);

export function useUsersRegistry1() {
  const ctx = useContext(UsersRegistry1Context);
  if (!ctx) {
    throw new Error(`useUsersRegistry1 must be used within a UsersRegistry1`);
  }
  return ctx;
}

interface UsersRegistry1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function UsersRegistry1({
  children,
  initialActive = false,
  initialLabel = 'UsersRegistry1',
}: UsersRegistry1Props) {
  const [state, setState] = useState<UsersRegistry1State>({
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

  const contextValue = useMemo<UsersRegistry1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <UsersRegistry1Context.Provider value={contextValue}>
      {children}
      <SettingsCard3 />
    </UsersRegistry1Context.Provider>
  );
}
