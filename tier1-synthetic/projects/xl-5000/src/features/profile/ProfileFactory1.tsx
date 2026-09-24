import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ProfileList1 from './ProfileList1';
import ProfileErrorBoundary from './ProfileErrorBoundary';
import ProfileRegistry from './ProfileRegistry';

interface ProfileFactory1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ProfileFactory1ContextValue {
  state: ProfileFactory1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ProfileFactory1Context = createContext<ProfileFactory1ContextValue | null>(null);

export function useProfileFactory1() {
  const ctx = useContext(ProfileFactory1Context);
  if (!ctx) {
    throw new Error(`useProfileFactory1 must be used within a ProfileFactory1`);
  }
  return ctx;
}

interface ProfileFactory1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ProfileFactory1({
  children,
  initialActive = false,
  initialLabel = 'ProfileFactory1',
}: ProfileFactory1Props) {
  const [state, setState] = useState<ProfileFactory1State>({
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

  const contextValue = useMemo<ProfileFactory1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ProfileFactory1Context.Provider value={contextValue}>
      {children}
      <ProfileList1 />
      <ProfileErrorBoundary />
      <ProfileRegistry />
    </ProfileFactory1Context.Provider>
  );
}
