import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CampaignsBottomNav2 from './CampaignsBottomNav2';
import WorkflowsFactory from '../workflows/WorkflowsFactory';

interface CampaignsFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CampaignsFactoryContextValue {
  state: CampaignsFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CampaignsFactoryContext = createContext<CampaignsFactoryContextValue | null>(null);

export function useCampaignsFactory() {
  const ctx = useContext(CampaignsFactoryContext);
  if (!ctx) {
    throw new Error(`useCampaignsFactory must be used within a CampaignsFactory`);
  }
  return ctx;
}

interface CampaignsFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CampaignsFactory({
  children,
  initialActive = false,
  initialLabel = 'CampaignsFactory',
}: CampaignsFactoryProps) {
  const [state, setState] = useState<CampaignsFactoryState>({
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

  const contextValue = useMemo<CampaignsFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CampaignsFactoryContext.Provider value={contextValue}>
      {children}
      <CampaignsBottomNav2 />
      <WorkflowsFactory />
    </CampaignsFactoryContext.Provider>
  );
}
