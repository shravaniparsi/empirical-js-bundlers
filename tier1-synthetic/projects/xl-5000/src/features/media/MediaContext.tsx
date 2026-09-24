import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import MediaMeter from './MediaMeter';
import MediaSkeleton from './MediaSkeleton';
import MediaRadio from './MediaRadio';
import RolesLoader from '../roles/RolesLoader';

interface MediaContextState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface MediaContextContextValue {
  state: MediaContextState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const MediaContextContext = createContext<MediaContextContextValue | null>(null);

export function useMediaContext() {
  const ctx = useContext(MediaContextContext);
  if (!ctx) {
    throw new Error(`useMediaContext must be used within a MediaContext`);
  }
  return ctx;
}

interface MediaContextProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function MediaContext({
  children,
  initialActive = false,
  initialLabel = 'MediaContext',
}: MediaContextProps) {
  const [state, setState] = useState<MediaContextState>({
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

  const contextValue = useMemo<MediaContextContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <MediaContextContext.Provider value={contextValue}>
      {children}
      <MediaMeter />
      <MediaSkeleton />
      <MediaRadio />
      <RolesLoader />
    </MediaContextContext.Provider>
  );
}
