import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ProfileRangeSlider from './ProfileRangeSlider';
import DashboardPanel1 from '../dashboard/DashboardPanel1';
import BillingSelect1 from '../billing/BillingSelect1';
import ImportsRank from '../imports/ImportsRank';

interface ProfileComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ProfileComposerContextValue {
  state: ProfileComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ProfileComposerContext = createContext<ProfileComposerContextValue | null>(null);

export function useProfileComposer() {
  const ctx = useContext(ProfileComposerContext);
  if (!ctx) {
    throw new Error(`useProfileComposer must be used within a ProfileComposer`);
  }
  return ctx;
}

interface ProfileComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ProfileComposer({
  children,
  initialActive = false,
  initialLabel = 'ProfileComposer',
}: ProfileComposerProps) {
  const [state, setState] = useState<ProfileComposerState>({
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

  const contextValue = useMemo<ProfileComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ProfileComposerContext.Provider value={contextValue}>
      {children}
      <ProfileRangeSlider />
      <DashboardPanel1 />
      <BillingSelect1 />
      <ImportsRank />
    </ProfileComposerContext.Provider>
  );
}
