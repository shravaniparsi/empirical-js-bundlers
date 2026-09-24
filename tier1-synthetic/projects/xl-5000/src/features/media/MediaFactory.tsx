import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import MediaHeader from './MediaHeader';
import ThemesTreeView from '../themes/ThemesTreeView';

interface MediaFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface MediaFactoryContextValue {
  state: MediaFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const MediaFactoryContext = createContext<MediaFactoryContextValue | null>(null);

export function useMediaFactory() {
  const ctx = useContext(MediaFactoryContext);
  if (!ctx) {
    throw new Error(`useMediaFactory must be used within a MediaFactory`);
  }
  return ctx;
}

interface MediaFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function MediaFactory({
  children,
  initialActive = false,
  initialLabel = 'MediaFactory',
}: MediaFactoryProps) {
  const [state, setState] = useState<MediaFactoryState>({
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

  const contextValue = useMemo<MediaFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <MediaFactoryContext.Provider value={contextValue}>
      {children}
      <MediaHeader />
      <ThemesTreeView />
    </MediaFactoryContext.Provider>
  );
}
