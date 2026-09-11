import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface DashboardHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface DashboardHOCContextValue {
  state: DashboardHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const DashboardHOCContext = createContext<DashboardHOCContextValue | null>(null);

export function useDashboardHOC() {
  const ctx = useContext(DashboardHOCContext);
  if (!ctx) {
    throw new Error(`useDashboardHOC must be used within a DashboardHOC`);
  }
  return ctx;
}

interface DashboardHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function DashboardHOC({
  children,
  initialActive = false,
  initialLabel = 'DashboardHOC',
}: DashboardHOCProps) {
  const [state, setState] = useState<DashboardHOCState>({
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

  const contextValue = useMemo<DashboardHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <DashboardHOCContext.Provider value={contextValue}>
      {children}

    </DashboardHOCContext.Provider>
  );
}
