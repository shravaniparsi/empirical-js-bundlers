import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TagsSelect from './TagsSelect';

interface TagsWrapperState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TagsWrapperContextValue {
  state: TagsWrapperState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TagsWrapperContext = createContext<TagsWrapperContextValue | null>(null);

export function useTagsWrapper() {
  const ctx = useContext(TagsWrapperContext);
  if (!ctx) {
    throw new Error(`useTagsWrapper must be used within a TagsWrapper`);
  }
  return ctx;
}

interface TagsWrapperProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TagsWrapper({
  children,
  initialActive = false,
  initialLabel = 'TagsWrapper',
}: TagsWrapperProps) {
  const [state, setState] = useState<TagsWrapperState>({
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

  const contextValue = useMemo<TagsWrapperContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TagsWrapperContext.Provider value={contextValue}>
      {children}
      <TagsSelect />
    </TagsWrapperContext.Provider>
  );
}
