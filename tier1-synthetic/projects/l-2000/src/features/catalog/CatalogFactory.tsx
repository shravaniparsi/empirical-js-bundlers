import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CatalogModal from './CatalogModal';

interface CatalogFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CatalogFactoryContextValue {
  state: CatalogFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CatalogFactoryContext = createContext<CatalogFactoryContextValue | null>(null);

export function useCatalogFactory() {
  const ctx = useContext(CatalogFactoryContext);
  if (!ctx) {
    throw new Error(`useCatalogFactory must be used within a CatalogFactory`);
  }
  return ctx;
}

interface CatalogFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CatalogFactory({
  children,
  initialActive = false,
  initialLabel = 'CatalogFactory',
}: CatalogFactoryProps) {
  const [state, setState] = useState<CatalogFactoryState>({
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

  const contextValue = useMemo<CatalogFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CatalogFactoryContext.Provider value={contextValue}>
      {children}
      <CatalogModal />
    </CatalogFactoryContext.Provider>
  );
}
