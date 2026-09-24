import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ExportsSnackbar from './ExportsSnackbar';
import ExportsResponsive from './ExportsResponsive';

interface ExportsBridge1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ExportsBridge1ContextValue {
  state: ExportsBridge1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ExportsBridge1Context = createContext<ExportsBridge1ContextValue | null>(null);

export function useExportsBridge1() {
  const ctx = useContext(ExportsBridge1Context);
  if (!ctx) {
    throw new Error(`useExportsBridge1 must be used within a ExportsBridge1`);
  }
  return ctx;
}

interface ExportsBridge1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ExportsBridge1({
  children,
  initialActive = false,
  initialLabel = 'ExportsBridge1',
}: ExportsBridge1Props) {
  const [state, setState] = useState<ExportsBridge1State>({
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

  const contextValue = useMemo<ExportsBridge1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ExportsBridge1Context.Provider value={contextValue}>
      {children}
      <ExportsSnackbar />
      <ExportsResponsive />
    </ExportsBridge1Context.Provider>
  );
}
