import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TagsBreadcrumb1 from './TagsBreadcrumb1';
import TagsPagination1 from './TagsPagination1';

interface TagsContext1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TagsContext1ContextValue {
  state: TagsContext1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TagsContext1Context = createContext<TagsContext1ContextValue | null>(null);

export function useTagsContext1() {
  const ctx = useContext(TagsContext1Context);
  if (!ctx) {
    throw new Error(`useTagsContext1 must be used within a TagsContext1`);
  }
  return ctx;
}

interface TagsContext1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TagsContext1({
  children,
  initialActive = false,
  initialLabel = 'TagsContext1',
}: TagsContext1Props) {
  const [state, setState] = useState<TagsContext1State>({
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

  const contextValue = useMemo<TagsContext1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TagsContext1Context.Provider value={contextValue}>
      {children}
      <TagsBreadcrumb1 />
      <TagsPagination1 />
    </TagsContext1Context.Provider>
  );
}
