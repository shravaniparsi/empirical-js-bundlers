import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CampaignsSticky from './CampaignsSticky';
import CampaignsBottomNav1 from './CampaignsBottomNav1';

interface CampaignsWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CampaignsWrapperContextValue {
  state: CampaignsWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CampaignsWrapperContext = createContext<CampaignsWrapperContextValue | null>(null);

export function useCampaignsWrapper() {
  const ctx = useContext(CampaignsWrapperContext);
  if (!ctx) {
    throw new Error(`useCampaignsWrapper must be used within a CampaignsWrapper`);
  }
  return ctx;
}

interface CampaignsWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CampaignsWrapper({
  children,
  initialActive = false,
  initialLabel = 'CampaignsWrapper',
}: CampaignsWrapperProps) {
  const [state, setState] = useState<CampaignsWrapperState>({
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

  const contextValue = useMemo<CampaignsWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CampaignsWrapperContext.Provider value={contextValue}>
      {children}
      <CampaignsSticky />
      <CampaignsBottomNav1 />
    </CampaignsWrapperContext.Provider>
  );
}
