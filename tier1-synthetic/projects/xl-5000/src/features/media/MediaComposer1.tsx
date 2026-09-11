import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';


interface MediaComposer1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface MediaComposer1ContextValue {
  state: MediaComposer1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const MediaComposer1Context = createContext<MediaComposer1ContextValue | null>(null);

export function useMediaComposer1() {
  const ctx = useContext(MediaComposer1Context);
  if (!ctx) {
    throw new Error(`useMediaComposer1 must be used within a MediaComposer1`);
  }
  return ctx;
}

interface MediaComposer1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function MediaComposer1({
  children,
  initialActive = false,
  initialLabel = 'MediaComposer1',
}: MediaComposer1Props) {
  const [state, setState] = useState<MediaComposer1State>({
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

  const contextValue = useMemo<MediaComposer1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <MediaComposer1Context.Provider value={contextValue}>
      {children}

    </MediaComposer1Context.Provider>
  );
}
