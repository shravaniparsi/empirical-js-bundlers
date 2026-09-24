import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import RolesAccordion1 from './RolesAccordion1';
import RolesTimePicker from './RolesTimePicker';
import RolesAvatar from './RolesAvatar';

interface RolesAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface RolesAdapterContextValue {
  state: RolesAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const RolesAdapterContext = createContext<RolesAdapterContextValue | null>(null);

export function useRolesAdapter() {
  const ctx = useContext(RolesAdapterContext);
  if (!ctx) {
    throw new Error(`useRolesAdapter must be used within a RolesAdapter`);
  }
  return ctx;
}

interface RolesAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function RolesAdapter({
  children,
  initialActive = false,
  initialLabel = 'RolesAdapter',
}: RolesAdapterProps) {
  const [state, setState] = useState<RolesAdapterState>({
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

  const contextValue = useMemo<RolesAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <RolesAdapterContext.Provider value={contextValue}>
      {children}
      <RolesAccordion1 />
      <RolesTimePicker />
      <RolesAvatar />
    </RolesAdapterContext.Provider>
  );
}
