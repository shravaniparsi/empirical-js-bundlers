import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CampaignsResponsive from './CampaignsResponsive';
import CampaignsCard from './CampaignsCard';
import FeedbackMgmtSummary from '../feedback-mgmt/FeedbackMgmtSummary';
import InventorySummary from '../inventory/InventorySummary';

interface CampaignsContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CampaignsContextContextValue {
  state: CampaignsContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CampaignsContextContext = createContext<CampaignsContextContextValue | null>(null);

export function useCampaignsContext() {
  const ctx = useContext(CampaignsContextContext);
  if (!ctx) {
    throw new Error(`useCampaignsContext must be used within a CampaignsContext`);
  }
  return ctx;
}

interface CampaignsContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CampaignsContext({
  children,
  initialActive = false,
  initialLabel = 'CampaignsContext',
}: CampaignsContextProps) {
  const [state, setState] = useState<CampaignsContextState>({
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

  const contextValue = useMemo<CampaignsContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CampaignsContextContext.Provider value={contextValue}>
      {children}
      <CampaignsResponsive />
      <CampaignsCard />
      <FeedbackMgmtSummary />
      <InventorySummary />
    </CampaignsContextContext.Provider>
  );
}
