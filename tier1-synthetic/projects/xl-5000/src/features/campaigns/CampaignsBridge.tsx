import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ImportsResponsive1 from '../imports/ImportsResponsive1';

interface CampaignsBridgeState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CampaignsBridgeContextValue {
  state: CampaignsBridgeState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CampaignsBridgeContext = createContext<CampaignsBridgeContextValue | null>(null);

export function useCampaignsBridge() {
  const ctx = useContext(CampaignsBridgeContext);
  if (!ctx) {
    throw new Error(`useCampaignsBridge must be used within a CampaignsBridge`);
  }
  return ctx;
}

interface CampaignsBridgeProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CampaignsBridge({
  children,
  initialActive = false,
  initialLabel = 'CampaignsBridge',
}: CampaignsBridgeProps) {
  const [state, setState] = useState<CampaignsBridgeState>({
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

  const contextValue = useMemo<CampaignsBridgeContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CampaignsBridgeContext.Provider value={contextValue}>
      {children}
      <ImportsResponsive1 />
    </CampaignsBridgeContext.Provider>
  );
}
