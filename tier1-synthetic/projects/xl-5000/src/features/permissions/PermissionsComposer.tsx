import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface PermissionsComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface PermissionsComposerContextValue {
  state: PermissionsComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const PermissionsComposerContext = createContext<PermissionsComposerContextValue | null>(null);

export function usePermissionsComposer() {
  const ctx = useContext(PermissionsComposerContext);
  if (!ctx) {
    throw new Error(`usePermissionsComposer must be used within a PermissionsComposer`);
  }
  return ctx;
}

interface PermissionsComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function PermissionsComposer({
  children,
  initialActive = false,
  initialLabel = 'PermissionsComposer',
}: PermissionsComposerProps) {
  const [state, setState] = useState<PermissionsComposerState>({
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

  const contextValue = useMemo<PermissionsComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <PermissionsComposerContext.Provider value={contextValue}>
      {children}

    </PermissionsComposerContext.Provider>
  );
}
