import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CampaignsMeter from './CampaignsMeter';
import CampaignsColorPicker from './CampaignsColorPicker';

interface CampaignsBridge1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CampaignsBridge1ContextValue {
  state: CampaignsBridge1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CampaignsBridge1Context = createContext<CampaignsBridge1ContextValue | null>(null);

export function useCampaignsBridge1() {
  const ctx = useContext(CampaignsBridge1Context);
  if (!ctx) {
    throw new Error(`useCampaignsBridge1 must be used within a CampaignsBridge1`);
  }
  return ctx;
}

interface CampaignsBridge1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CampaignsBridge1({
  children,
  initialActive = false,
  initialLabel = 'CampaignsBridge1',
}: CampaignsBridge1Props) {
  const [state, setState] = useState<CampaignsBridge1State>({
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

  const contextValue = useMemo<CampaignsBridge1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CampaignsBridge1Context.Provider value={contextValue}>
      {children}
      <CampaignsMeter />
      <CampaignsColorPicker />
    </CampaignsBridge1Context.Provider>
  );
}
