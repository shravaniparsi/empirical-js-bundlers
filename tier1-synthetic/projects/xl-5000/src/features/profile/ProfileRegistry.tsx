import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ProfileSkeleton1 from './ProfileSkeleton1';
import ProfileSplit1 from './ProfileSplit1';
import CheckoutPanel1 from '../checkout/CheckoutPanel1';
import PermissionsSplit1 from '../permissions/PermissionsSplit1';

interface ProfileRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ProfileRegistryContextValue {
  state: ProfileRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ProfileRegistryContext = createContext<ProfileRegistryContextValue | null>(null);

export function useProfileRegistry() {
  const ctx = useContext(ProfileRegistryContext);
  if (!ctx) {
    throw new Error(`useProfileRegistry must be used within a ProfileRegistry`);
  }
  return ctx;
}

interface ProfileRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ProfileRegistry({
  children,
  initialActive = false,
  initialLabel = 'ProfileRegistry',
}: ProfileRegistryProps) {
  const [state, setState] = useState<ProfileRegistryState>({
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

  const contextValue = useMemo<ProfileRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ProfileRegistryContext.Provider value={contextValue}>
      {children}
      <ProfileSkeleton1 />
      <ProfileSplit1 />
      <CheckoutPanel1 />
      <PermissionsSplit1 />
    </ProfileRegistryContext.Provider>
  );
}
