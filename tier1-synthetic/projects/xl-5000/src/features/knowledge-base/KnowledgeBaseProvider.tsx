import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import KnowledgeBaseAvatar from './KnowledgeBaseAvatar';
import KnowledgeBaseCached from './KnowledgeBaseCached';

interface KnowledgeBaseProviderState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface KnowledgeBaseProviderContextValue {
  state: KnowledgeBaseProviderState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const KnowledgeBaseProviderContext = createContext<KnowledgeBaseProviderContextValue | null>(null);

export function useKnowledgeBaseProvider() {
  const ctx = useContext(KnowledgeBaseProviderContext);
  if (!ctx) {
    throw new Error(`useKnowledgeBaseProvider must be used within a KnowledgeBaseProvider`);
  }
  return ctx;
}

interface KnowledgeBaseProviderProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function KnowledgeBaseProvider({
  children,
  initialActive = false,
  initialLabel = 'KnowledgeBaseProvider',
}: KnowledgeBaseProviderProps) {
  const [state, setState] = useState<KnowledgeBaseProviderState>({
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

  const contextValue = useMemo<KnowledgeBaseProviderContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <KnowledgeBaseProviderContext.Provider value={contextValue}>
      {children}
      <KnowledgeBaseAvatar />
      <KnowledgeBaseCached />
    </KnowledgeBaseProviderContext.Provider>
  );
}
