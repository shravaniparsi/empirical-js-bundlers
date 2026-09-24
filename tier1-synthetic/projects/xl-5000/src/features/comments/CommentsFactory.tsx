import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CommentsLabel from './CommentsLabel';
import CommentsLink from './CommentsLink';
import CommentsDrawer from './CommentsDrawer';

interface CommentsFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CommentsFactoryContextValue {
  state: CommentsFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CommentsFactoryContext = createContext<CommentsFactoryContextValue | null>(null);

export function useCommentsFactory() {
  const ctx = useContext(CommentsFactoryContext);
  if (!ctx) {
    throw new Error(`useCommentsFactory must be used within a CommentsFactory`);
  }
  return ctx;
}

interface CommentsFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CommentsFactory({
  children,
  initialActive = false,
  initialLabel = 'CommentsFactory',
}: CommentsFactoryProps) {
  const [state, setState] = useState<CommentsFactoryState>({
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

  const contextValue = useMemo<CommentsFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CommentsFactoryContext.Provider value={contextValue}>
      {children}
      <CommentsLabel />
      <CommentsLink />
      <CommentsDrawer />
    </CommentsFactoryContext.Provider>
  );
}
