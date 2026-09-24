import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CommentsStepper from './CommentsStepper';
import CommentsAreaChart2 from './CommentsAreaChart2';

interface CommentsHOC1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CommentsHOC1ContextValue {
  state: CommentsHOC1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CommentsHOC1Context = createContext<CommentsHOC1ContextValue | null>(null);

export function useCommentsHOC1() {
  const ctx = useContext(CommentsHOC1Context);
  if (!ctx) {
    throw new Error(`useCommentsHOC1 must be used within a CommentsHOC1`);
  }
  return ctx;
}

interface CommentsHOC1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CommentsHOC1({
  children,
  initialActive = false,
  initialLabel = 'CommentsHOC1',
}: CommentsHOC1Props) {
  const [state, setState] = useState<CommentsHOC1State>({
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

  const contextValue = useMemo<CommentsHOC1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CommentsHOC1Context.Provider value={contextValue}>
      {children}
      <CommentsStepper />
      <CommentsAreaChart2 />
    </CommentsHOC1Context.Provider>
  );
}
