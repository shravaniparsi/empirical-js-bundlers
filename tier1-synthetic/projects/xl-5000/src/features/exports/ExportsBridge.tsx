import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ExportsHeatmap1 from './ExportsHeatmap1';
import ExportsTag from './ExportsTag';
import ExportsRangeSlider from './ExportsRangeSlider';

interface ExportsBridgeState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ExportsBridgeContextValue {
  state: ExportsBridgeState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ExportsBridgeContext = createContext<ExportsBridgeContextValue | null>(null);

export function useExportsBridge() {
  const ctx = useContext(ExportsBridgeContext);
  if (!ctx) {
    throw new Error(`useExportsBridge must be used within a ExportsBridge`);
  }
  return ctx;
}

interface ExportsBridgeProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ExportsBridge({
  children,
  initialActive = false,
  initialLabel = 'ExportsBridge',
}: ExportsBridgeProps) {
  const [state, setState] = useState<ExportsBridgeState>({
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

  const contextValue = useMemo<ExportsBridgeContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ExportsBridgeContext.Provider value={contextValue}>
      {children}
      <ExportsHeatmap1 />
      <ExportsTag />
      <ExportsRangeSlider />
    </ExportsBridgeContext.Provider>
  );
}
