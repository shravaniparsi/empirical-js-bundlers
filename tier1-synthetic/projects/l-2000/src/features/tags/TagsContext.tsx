import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TagsStat from './TagsStat';
import TagsAdapter1 from './TagsAdapter1';

interface TagsContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TagsContextContextValue {
  state: TagsContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TagsContextContext = createContext<TagsContextContextValue | null>(null);

export function useTagsContext() {
  const ctx = useContext(TagsContextContext);
  if (!ctx) {
    throw new Error(`useTagsContext must be used within a TagsContext`);
  }
  return ctx;
}

interface TagsContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TagsContext({
  children,
  initialActive = false,
  initialLabel = 'TagsContext',
}: TagsContextProps) {
  const [state, setState] = useState<TagsContextState>({
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

  const contextValue = useMemo<TagsContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TagsContextContext.Provider value={contextValue}>
      {children}
      <TagsStat />
      <TagsAdapter1 />
    </TagsContextContext.Provider>
  );
}
