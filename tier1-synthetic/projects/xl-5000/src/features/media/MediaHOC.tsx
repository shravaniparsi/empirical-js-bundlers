import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import MediaStat from './MediaStat';

interface MediaHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface MediaHOCContextValue {
  state: MediaHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const MediaHOCContext = createContext<MediaHOCContextValue | null>(null);

export function useMediaHOC() {
  const ctx = useContext(MediaHOCContext);
  if (!ctx) {
    throw new Error(`useMediaHOC must be used within a MediaHOC`);
  }
  return ctx;
}

interface MediaHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function MediaHOC({
  children,
  initialActive = false,
  initialLabel = 'MediaHOC',
}: MediaHOCProps) {
  const [state, setState] = useState<MediaHOCState>({
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

  const contextValue = useMemo<MediaHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <MediaHOCContext.Provider value={contextValue}>
      {children}
      <MediaStat />
    </MediaHOCContext.Provider>
  );
}
