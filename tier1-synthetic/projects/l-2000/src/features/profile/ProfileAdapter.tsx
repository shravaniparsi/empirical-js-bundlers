import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ProfileNotification1 from './ProfileNotification1';
import ProfileProvider from './ProfileProvider';

interface ProfileAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ProfileAdapterContextValue {
  state: ProfileAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ProfileAdapterContext = createContext<ProfileAdapterContextValue | null>(null);

export function useProfileAdapter() {
  const ctx = useContext(ProfileAdapterContext);
  if (!ctx) {
    throw new Error(`useProfileAdapter must be used within a ProfileAdapter`);
  }
  return ctx;
}

interface ProfileAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ProfileAdapter({
  children,
  initialActive = false,
  initialLabel = 'ProfileAdapter',
}: ProfileAdapterProps) {
  const [state, setState] = useState<ProfileAdapterState>({
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

  const contextValue = useMemo<ProfileAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ProfileAdapterContext.Provider value={contextValue}>
      {children}
      <ProfileNotification1 />
      <ProfileProvider />
    </ProfileAdapterContext.Provider>
  );
}
