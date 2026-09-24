import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TagsTable from './TagsTable';
import TagsPagination1 from './TagsPagination1';
import TagsScroll1 from './TagsScroll1';

interface TagsAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TagsAdapterContextValue {
  state: TagsAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TagsAdapterContext = createContext<TagsAdapterContextValue | null>(null);

export function useTagsAdapter() {
  const ctx = useContext(TagsAdapterContext);
  if (!ctx) {
    throw new Error(`useTagsAdapter must be used within a TagsAdapter`);
  }
  return ctx;
}

interface TagsAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TagsAdapter({
  children,
  initialActive = false,
  initialLabel = 'TagsAdapter',
}: TagsAdapterProps) {
  const [state, setState] = useState<TagsAdapterState>({
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

  const contextValue = useMemo<TagsAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TagsAdapterContext.Provider value={contextValue}>
      {children}
      <TagsTable />
      <TagsPagination1 />
      <TagsScroll1 />
    </TagsAdapterContext.Provider>
  );
}
