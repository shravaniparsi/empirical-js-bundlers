import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CommentsFileUpload from './CommentsFileUpload';

interface CommentsRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CommentsRegistryContextValue {
  state: CommentsRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CommentsRegistryContext = createContext<CommentsRegistryContextValue | null>(null);

export function useCommentsRegistry() {
  const ctx = useContext(CommentsRegistryContext);
  if (!ctx) {
    throw new Error(`useCommentsRegistry must be used within a CommentsRegistry`);
  }
  return ctx;
}

interface CommentsRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CommentsRegistry({
  children,
  initialActive = false,
  initialLabel = 'CommentsRegistry',
}: CommentsRegistryProps) {
  const [state, setState] = useState<CommentsRegistryState>({
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

  const contextValue = useMemo<CommentsRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CommentsRegistryContext.Provider value={contextValue}>
      {children}
      <CommentsFileUpload />
    </CommentsRegistryContext.Provider>
  );
}
