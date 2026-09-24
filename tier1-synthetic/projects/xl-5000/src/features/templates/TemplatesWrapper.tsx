import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TemplatesBadge from './TemplatesBadge';
import TemplatesRank1 from './TemplatesRank1';
import TemplatesTabs from './TemplatesTabs';

interface TemplatesWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TemplatesWrapperContextValue {
  state: TemplatesWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TemplatesWrapperContext = createContext<TemplatesWrapperContextValue | null>(null);

export function useTemplatesWrapper() {
  const ctx = useContext(TemplatesWrapperContext);
  if (!ctx) {
    throw new Error(`useTemplatesWrapper must be used within a TemplatesWrapper`);
  }
  return ctx;
}

interface TemplatesWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TemplatesWrapper({
  children,
  initialActive = false,
  initialLabel = 'TemplatesWrapper',
}: TemplatesWrapperProps) {
  const [state, setState] = useState<TemplatesWrapperState>({
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

  const contextValue = useMemo<TemplatesWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TemplatesWrapperContext.Provider value={contextValue}>
      {children}
      <TemplatesBadge />
      <TemplatesRank1 />
      <TemplatesTabs />
    </TemplatesWrapperContext.Provider>
  );
}
