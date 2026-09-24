import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TagsSticky1 from './TagsSticky1';
import TagsPaginated1 from './TagsPaginated1';

interface TagsProvider1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TagsProvider1ContextValue {
  state: TagsProvider1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TagsProvider1Context = createContext<TagsProvider1ContextValue | null>(null);

export function useTagsProvider1() {
  const ctx = useContext(TagsProvider1Context);
  if (!ctx) {
    throw new Error(`useTagsProvider1 must be used within a TagsProvider1`);
  }
  return ctx;
}

interface TagsProvider1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TagsProvider1({
  children,
  initialActive = false,
  initialLabel = 'TagsProvider1',
}: TagsProvider1Props) {
  const [state, setState] = useState<TagsProvider1State>({
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

  const contextValue = useMemo<TagsProvider1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TagsProvider1Context.Provider value={contextValue}>
      {children}
      <TagsSticky1 />
      <TagsPaginated1 />
    </TagsProvider1Context.Provider>
  );
}
