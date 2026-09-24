import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import SchedulingPolling from '../scheduling/SchedulingPolling';

interface FormsBridgeState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface FormsBridgeContextValue {
  state: FormsBridgeState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const FormsBridgeContext = createContext<FormsBridgeContextValue | null>(null);

export function useFormsBridge() {
  const ctx = useContext(FormsBridgeContext);
  if (!ctx) {
    throw new Error(`useFormsBridge must be used within a FormsBridge`);
  }
  return ctx;
}

interface FormsBridgeProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function FormsBridge({
  children,
  initialActive = false,
  initialLabel = 'FormsBridge',
}: FormsBridgeProps) {
  const [state, setState] = useState<FormsBridgeState>({
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

  const contextValue = useMemo<FormsBridgeContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <FormsBridgeContext.Provider value={contextValue}>
      {children}
      <SchedulingPolling />
    </FormsBridgeContext.Provider>
  );
}
