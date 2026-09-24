import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ProfileFeed from './ProfileFeed';

interface ProfileWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ProfileWrapperContextValue {
  state: ProfileWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ProfileWrapperContext = createContext<ProfileWrapperContextValue | null>(null);

export function useProfileWrapper() {
  const ctx = useContext(ProfileWrapperContext);
  if (!ctx) {
    throw new Error(`useProfileWrapper must be used within a ProfileWrapper`);
  }
  return ctx;
}

interface ProfileWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ProfileWrapper({
  children,
  initialActive = false,
  initialLabel = 'ProfileWrapper',
}: ProfileWrapperProps) {
  const [state, setState] = useState<ProfileWrapperState>({
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

  const contextValue = useMemo<ProfileWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ProfileWrapperContext.Provider value={contextValue}>
      {children}
      <ProfileFeed />
    </ProfileWrapperContext.Provider>
  );
}
