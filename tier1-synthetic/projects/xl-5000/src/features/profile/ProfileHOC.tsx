import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ProfileMeter from './ProfileMeter';

interface ProfileHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ProfileHOCContextValue {
  state: ProfileHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ProfileHOCContext = createContext<ProfileHOCContextValue | null>(null);

export function useProfileHOC() {
  const ctx = useContext(ProfileHOCContext);
  if (!ctx) {
    throw new Error(`useProfileHOC must be used within a ProfileHOC`);
  }
  return ctx;
}

interface ProfileHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ProfileHOC({
  children,
  initialActive = false,
  initialLabel = 'ProfileHOC',
}: ProfileHOCProps) {
  const [state, setState] = useState<ProfileHOCState>({
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

  const contextValue = useMemo<ProfileHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ProfileHOCContext.Provider value={contextValue}>
      {children}
      <ProfileMeter />
    </ProfileHOCContext.Provider>
  );
}
