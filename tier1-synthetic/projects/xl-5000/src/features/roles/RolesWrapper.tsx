import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import RolesFeed from './RolesFeed';
import RolesTimeline from './RolesTimeline';
import RolesCheckbox1 from './RolesCheckbox1';

interface RolesWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface RolesWrapperContextValue {
  state: RolesWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const RolesWrapperContext = createContext<RolesWrapperContextValue | null>(null);

export function useRolesWrapper() {
  const ctx = useContext(RolesWrapperContext);
  if (!ctx) {
    throw new Error(`useRolesWrapper must be used within a RolesWrapper`);
  }
  return ctx;
}

interface RolesWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function RolesWrapper({
  children,
  initialActive = false,
  initialLabel = 'RolesWrapper',
}: RolesWrapperProps) {
  const [state, setState] = useState<RolesWrapperState>({
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

  const contextValue = useMemo<RolesWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <RolesWrapperContext.Provider value={contextValue}>
      {children}
      <RolesFeed />
      <RolesTimeline />
      <RolesCheckbox1 />
    </RolesWrapperContext.Provider>
  );
}
