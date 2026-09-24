import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TagsColorPicker1 from './TagsColorPicker1';

interface TagsBridge1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TagsBridge1ContextValue {
  state: TagsBridge1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TagsBridge1Context = createContext<TagsBridge1ContextValue | null>(null);

export function useTagsBridge1() {
  const ctx = useContext(TagsBridge1Context);
  if (!ctx) {
    throw new Error(`useTagsBridge1 must be used within a TagsBridge1`);
  }
  return ctx;
}

interface TagsBridge1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TagsBridge1({
  children,
  initialActive = false,
  initialLabel = 'TagsBridge1',
}: TagsBridge1Props) {
  const [state, setState] = useState<TagsBridge1State>({
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

  const contextValue = useMemo<TagsBridge1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TagsBridge1Context.Provider value={contextValue}>
      {children}
      <TagsColorPicker1 />
    </TagsBridge1Context.Provider>
  );
}
