import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import MediaTooltip from './MediaTooltip';
import AdminMeter from '../admin/AdminMeter';

interface MediaAdapterState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface MediaAdapterContextValue {
  state: MediaAdapterState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const MediaAdapterContext = createContext<MediaAdapterContextValue | null>(null);

export function useMediaAdapter() {
  const ctx = useContext(MediaAdapterContext);
  if (!ctx) {
    throw new Error(`useMediaAdapter must be used within a MediaAdapter`);
  }
  return ctx;
}

interface MediaAdapterProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function MediaAdapter({
  children,
  initialActive = false,
  initialLabel = 'MediaAdapter',
}: MediaAdapterProps) {
  const [state, setState] = useState<MediaAdapterState>({
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

  const contextValue = useMemo<MediaAdapterContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <MediaAdapterContext.Provider value={contextValue}>
      {children}
      <MediaTooltip />
      <AdminMeter />
    </MediaAdapterContext.Provider>
  );
}
