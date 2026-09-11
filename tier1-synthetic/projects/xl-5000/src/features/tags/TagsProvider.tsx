import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TagsHeader from './TagsHeader';
import PaymentsSidebar from '../payments/PaymentsSidebar';

interface TagsProviderState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TagsProviderContextValue {
  state: TagsProviderState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TagsProviderContext = createContext<TagsProviderContextValue | null>(null);

export function useTagsProvider() {
  const ctx = useContext(TagsProviderContext);
  if (!ctx) {
    throw new Error(`useTagsProvider must be used within a TagsProvider`);
  }
  return ctx;
}

interface TagsProviderProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TagsProvider({
  children,
  initialActive = false,
  initialLabel = 'TagsProvider',
}: TagsProviderProps) {
  const [state, setState] = useState<TagsProviderState>({
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

  const contextValue = useMemo<TagsProviderContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TagsProviderContext.Provider value={contextValue}>
      {children}
      <TagsHeader />
      <PaymentsSidebar />
    </TagsProviderContext.Provider>
  );
}
