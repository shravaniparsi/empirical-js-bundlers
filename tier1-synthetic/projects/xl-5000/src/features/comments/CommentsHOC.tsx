import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface CommentsHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CommentsHOCContextValue {
  state: CommentsHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CommentsHOCContext = createContext<CommentsHOCContextValue | null>(null);

export function useCommentsHOC() {
  const ctx = useContext(CommentsHOCContext);
  if (!ctx) {
    throw new Error(`useCommentsHOC must be used within a CommentsHOC`);
  }
  return ctx;
}

interface CommentsHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CommentsHOC({
  children,
  initialActive = false,
  initialLabel = 'CommentsHOC',
}: CommentsHOCProps) {
  const [state, setState] = useState<CommentsHOCState>({
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

  const contextValue = useMemo<CommentsHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CommentsHOCContext.Provider value={contextValue}>
      {children}

    </CommentsHOCContext.Provider>
  );
}
