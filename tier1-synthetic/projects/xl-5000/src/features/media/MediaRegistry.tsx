import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import MediaComposer from './MediaComposer';

interface MediaRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface MediaRegistryContextValue {
  state: MediaRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const MediaRegistryContext = createContext<MediaRegistryContextValue | null>(null);

export function useMediaRegistry() {
  const ctx = useContext(MediaRegistryContext);
  if (!ctx) {
    throw new Error(`useMediaRegistry must be used within a MediaRegistry`);
  }
  return ctx;
}

interface MediaRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function MediaRegistry({
  children,
  initialActive = false,
  initialLabel = 'MediaRegistry',
}: MediaRegistryProps) {
  const [state, setState] = useState<MediaRegistryState>({
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

  const contextValue = useMemo<MediaRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <MediaRegistryContext.Provider value={contextValue}>
      {children}
      <MediaComposer />
    </MediaRegistryContext.Provider>
  );
}
