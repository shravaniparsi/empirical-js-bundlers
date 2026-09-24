import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ProfileSummary1 from './ProfileSummary1';
import ProfileTimePicker from './ProfileTimePicker';

interface ProfileFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ProfileFactoryContextValue {
  state: ProfileFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ProfileFactoryContext = createContext<ProfileFactoryContextValue | null>(null);

export function useProfileFactory() {
  const ctx = useContext(ProfileFactoryContext);
  if (!ctx) {
    throw new Error(`useProfileFactory must be used within a ProfileFactory`);
  }
  return ctx;
}

interface ProfileFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ProfileFactory({
  children,
  initialActive = false,
  initialLabel = 'ProfileFactory',
}: ProfileFactoryProps) {
  const [state, setState] = useState<ProfileFactoryState>({
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

  const contextValue = useMemo<ProfileFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ProfileFactoryContext.Provider value={contextValue}>
      {children}
      <ProfileSummary1 />
      <ProfileTimePicker />
    </ProfileFactoryContext.Provider>
  );
}
