import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import KnowledgeBaseFooter from './KnowledgeBaseFooter';
import KnowledgeBaseRangeSlider from './KnowledgeBaseRangeSlider';

interface KnowledgeBaseHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface KnowledgeBaseHOCContextValue {
  state: KnowledgeBaseHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const KnowledgeBaseHOCContext = createContext<KnowledgeBaseHOCContextValue | null>(null);

export function useKnowledgeBaseHOC() {
  const ctx = useContext(KnowledgeBaseHOCContext);
  if (!ctx) {
    throw new Error(`useKnowledgeBaseHOC must be used within a KnowledgeBaseHOC`);
  }
  return ctx;
}

interface KnowledgeBaseHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function KnowledgeBaseHOC({
  children,
  initialActive = false,
  initialLabel = 'KnowledgeBaseHOC',
}: KnowledgeBaseHOCProps) {
  const [state, setState] = useState<KnowledgeBaseHOCState>({
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

  const contextValue = useMemo<KnowledgeBaseHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <KnowledgeBaseHOCContext.Provider value={contextValue}>
      {children}
      <KnowledgeBaseFooter />
      <KnowledgeBaseRangeSlider />
    </KnowledgeBaseHOCContext.Provider>
  );
}
