import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CommentsThumbnail2 from './CommentsThumbnail2';
import CommentsResponsive from './CommentsResponsive';
import UsersTextArea from '../users/UsersTextArea';

interface CommentsComposerState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CommentsComposerContextValue {
  state: CommentsComposerState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CommentsComposerContext = createContext<CommentsComposerContextValue | null>(null);

export function useCommentsComposer() {
  const ctx = useContext(CommentsComposerContext);
  if (!ctx) {
    throw new Error(`useCommentsComposer must be used within a CommentsComposer`);
  }
  return ctx;
}

interface CommentsComposerProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CommentsComposer({
  children,
  initialActive = false,
  initialLabel = 'CommentsComposer',
}: CommentsComposerProps) {
  const [state, setState] = useState<CommentsComposerState>({
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

  const contextValue = useMemo<CommentsComposerContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CommentsComposerContext.Provider value={contextValue}>
      {children}
      <CommentsThumbnail2 />
      <CommentsResponsive />
      <UsersTextArea />
    </CommentsComposerContext.Provider>
  );
}
