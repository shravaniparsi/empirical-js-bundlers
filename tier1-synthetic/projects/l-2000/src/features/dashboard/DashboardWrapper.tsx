import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import DashboardSelect from './DashboardSelect';
import DashboardGrid1 from './DashboardGrid1';
import ReportsTimePicker3 from '../reports/ReportsTimePicker3';
import ProfileProvider from '../profile/ProfileProvider';

interface DashboardWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface DashboardWrapperContextValue {
  state: DashboardWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const DashboardWrapperContext = createContext<DashboardWrapperContextValue | null>(null);

export function useDashboardWrapper() {
  const ctx = useContext(DashboardWrapperContext);
  if (!ctx) {
    throw new Error(`useDashboardWrapper must be used within a DashboardWrapper`);
  }
  return ctx;
}

interface DashboardWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function DashboardWrapper({
  children,
  initialActive = false,
  initialLabel = 'DashboardWrapper',
}: DashboardWrapperProps) {
  const [state, setState] = useState<DashboardWrapperState>({
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

  const contextValue = useMemo<DashboardWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <DashboardWrapperContext.Provider value={contextValue}>
      {children}
      <DashboardSelect />
      <DashboardGrid1 />
      <ReportsTimePicker3 />
      <ProfileProvider />
    </DashboardWrapperContext.Provider>
  );
}
