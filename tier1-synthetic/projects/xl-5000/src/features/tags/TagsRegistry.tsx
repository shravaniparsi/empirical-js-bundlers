import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TagsDrawer from './TagsDrawer';

interface TagsRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TagsRegistryContextValue {
  state: TagsRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TagsRegistryContext = createContext<TagsRegistryContextValue | null>(null);

export function useTagsRegistry() {
  const ctx = useContext(TagsRegistryContext);
  if (!ctx) {
    throw new Error(`useTagsRegistry must be used within a TagsRegistry`);
  }
  return ctx;
}

interface TagsRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TagsRegistry({
  children,
  initialActive = false,
  initialLabel = 'TagsRegistry',
}: TagsRegistryProps) {
  const [state, setState] = useState<TagsRegistryState>({
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

  const contextValue = useMemo<TagsRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TagsRegistryContext.Provider value={contextValue}>
      {children}
      <TagsDrawer />
    </TagsRegistryContext.Provider>
  );
}
