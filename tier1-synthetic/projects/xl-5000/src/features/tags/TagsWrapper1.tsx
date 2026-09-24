import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TagsSlider from './TagsSlider';
import TagsTable from './TagsTable';
import TagsSidebar2 from './TagsSidebar2';

interface TagsWrapper1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TagsWrapper1ContextValue {
  state: TagsWrapper1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TagsWrapper1Context = createContext<TagsWrapper1ContextValue | null>(null);

export function useTagsWrapper1() {
  const ctx = useContext(TagsWrapper1Context);
  if (!ctx) {
    throw new Error(`useTagsWrapper1 must be used within a TagsWrapper1`);
  }
  return ctx;
}

interface TagsWrapper1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TagsWrapper1({
  children,
  initialActive = false,
  initialLabel = 'TagsWrapper1',
}: TagsWrapper1Props) {
  const [state, setState] = useState<TagsWrapper1State>({
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

  const contextValue = useMemo<TagsWrapper1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TagsWrapper1Context.Provider value={contextValue}>
      {children}
      <TagsSlider />
      <TagsTable />
      <TagsSidebar2 />
    </TagsWrapper1Context.Provider>
  );
}
