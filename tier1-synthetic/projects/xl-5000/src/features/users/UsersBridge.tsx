import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import UsersMenu from './UsersMenu';
import ProfileNavBar1 from '../profile/ProfileNavBar1';

interface UsersBridgeState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface UsersBridgeContextValue {
  state: UsersBridgeState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const UsersBridgeContext = createContext<UsersBridgeContextValue | null>(null);

export function useUsersBridge() {
  const ctx = useContext(UsersBridgeContext);
  if (!ctx) {
    throw new Error(`useUsersBridge must be used within a UsersBridge`);
  }
  return ctx;
}

interface UsersBridgeProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function UsersBridge({
  children,
  initialActive = false,
  initialLabel = 'UsersBridge',
}: UsersBridgeProps) {
  const [state, setState] = useState<UsersBridgeState>({
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

  const contextValue = useMemo<UsersBridgeContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <UsersBridgeContext.Provider value={contextValue}>
      {children}
      <UsersMenu />
      <ProfileNavBar1 />
    </UsersBridgeContext.Provider>
  );
}
