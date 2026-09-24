import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ReportsThumbnail1 from './ReportsThumbnail1';

interface ReportsBridgeState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ReportsBridgeContextValue {
  state: ReportsBridgeState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ReportsBridgeContext = createContext<ReportsBridgeContextValue | null>(null);

export function useReportsBridge() {
  const ctx = useContext(ReportsBridgeContext);
  if (!ctx) {
    throw new Error(`useReportsBridge must be used within a ReportsBridge`);
  }
  return ctx;
}

interface ReportsBridgeProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ReportsBridge({
  children,
  initialActive = false,
  initialLabel = 'ReportsBridge',
}: ReportsBridgeProps) {
  const [state, setState] = useState<ReportsBridgeState>({
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

  const contextValue = useMemo<ReportsBridgeContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ReportsBridgeContext.Provider value={contextValue}>
      {children}
      <ReportsThumbnail1 />
    </ReportsBridgeContext.Provider>
  );
}
