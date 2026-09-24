import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import PermissionsList1 from './PermissionsList1';

interface PermissionsBridgeState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface PermissionsBridgeContextValue {
  state: PermissionsBridgeState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const PermissionsBridgeContext = createContext<PermissionsBridgeContextValue | null>(null);

export function usePermissionsBridge() {
  const ctx = useContext(PermissionsBridgeContext);
  if (!ctx) {
    throw new Error(`usePermissionsBridge must be used within a PermissionsBridge`);
  }
  return ctx;
}

interface PermissionsBridgeProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function PermissionsBridge({
  children,
  initialActive = false,
  initialLabel = 'PermissionsBridge',
}: PermissionsBridgeProps) {
  const [state, setState] = useState<PermissionsBridgeState>({
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

  const contextValue = useMemo<PermissionsBridgeContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <PermissionsBridgeContext.Provider value={contextValue}>
      {children}
      <PermissionsList1 />
    </PermissionsBridgeContext.Provider>
  );
}
