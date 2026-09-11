import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CampaignsAreaChart1 from './CampaignsAreaChart1';
import CampaignsHeatmap from './CampaignsHeatmap';

interface CampaignsHookState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CampaignsHookContextValue {
  state: CampaignsHookState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CampaignsHookContext = createContext<CampaignsHookContextValue | null>(null);

export function useCampaignsHook() {
  const ctx = useContext(CampaignsHookContext);
  if (!ctx) {
    throw new Error(`useCampaignsHook must be used within a CampaignsHook`);
  }
  return ctx;
}

interface CampaignsHookProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CampaignsHook({
  children,
  initialActive = false,
  initialLabel = 'CampaignsHook',
}: CampaignsHookProps) {
  const [state, setState] = useState<CampaignsHookState>({
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

  const contextValue = useMemo<CampaignsHookContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CampaignsHookContext.Provider value={contextValue}>
      {children}
      <CampaignsAreaChart1 />
      <CampaignsHeatmap />
    </CampaignsHookContext.Provider>
  );
}
