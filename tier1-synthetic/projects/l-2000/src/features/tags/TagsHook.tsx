import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import TagsDivider from './TagsDivider';
import TagsFunnel from './TagsFunnel';
import WebhooksRegistry from '../webhooks/WebhooksRegistry';
import CheckoutScroll from '../checkout/CheckoutScroll';

interface TagsHookState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface TagsHookContextValue {
  state: TagsHookState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const TagsHookContext = createContext<TagsHookContextValue | null>(null);

export function useTagsHook() {
  const ctx = useContext(TagsHookContext);
  if (!ctx) {
    throw new Error(`useTagsHook must be used within a TagsHook`);
  }
  return ctx;
}

interface TagsHookProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function TagsHook({
  children,
  initialActive = false,
  initialLabel = 'TagsHook',
}: TagsHookProps) {
  const [state, setState] = useState<TagsHookState>({
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

  const contextValue = useMemo<TagsHookContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <TagsHookContext.Provider value={contextValue}>
      {children}
      <TagsDivider />
      <TagsFunnel />
      <WebhooksRegistry />
      <CheckoutScroll />
    </TagsHookContext.Provider>
  );
}
