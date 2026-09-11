import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TagsStat from './TagsStat';
import TagsPanel from './TagsPanel';

interface TagsAdapter1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TagsAdapter1ContextValue {
  state: TagsAdapter1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TagsAdapter1Context = createContext<TagsAdapter1ContextValue | null>(null);

export function useTagsAdapter1() {
  const ctx = useContext(TagsAdapter1Context);
  if (!ctx) {
    throw new Error(`useTagsAdapter1 must be used within a TagsAdapter1`);
  }
  return ctx;
}

interface TagsAdapter1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TagsAdapter1({
  children,
  initialActive = false,
  initialLabel = 'TagsAdapter1',
}: TagsAdapter1Props) {
  const [state, setState] = useState<TagsAdapter1State>({
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

  const contextValue = useMemo<TagsAdapter1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TagsAdapter1Context.Provider value={contextValue}>
      {children}
      <TagsStat />
      <TagsPanel />
    </TagsAdapter1Context.Provider>
  );
}
