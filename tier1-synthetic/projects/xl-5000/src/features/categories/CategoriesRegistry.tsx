import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CategoriesPaginated from './CategoriesPaginated';
import ImportsThumbnail from '../imports/ImportsThumbnail';
import ReviewsSidebar from '../reviews/ReviewsSidebar';

interface CategoriesRegistryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CategoriesRegistryContextValue {
  state: CategoriesRegistryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CategoriesRegistryContext = createContext<CategoriesRegistryContextValue | null>(null);

export function useCategoriesRegistry() {
  const ctx = useContext(CategoriesRegistryContext);
  if (!ctx) {
    throw new Error(`useCategoriesRegistry must be used within a CategoriesRegistry`);
  }
  return ctx;
}

interface CategoriesRegistryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CategoriesRegistry({
  children,
  initialActive = false,
  initialLabel = 'CategoriesRegistry',
}: CategoriesRegistryProps) {
  const [state, setState] = useState<CategoriesRegistryState>({
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

  const contextValue = useMemo<CategoriesRegistryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CategoriesRegistryContext.Provider value={contextValue}>
      {children}
      <CategoriesPaginated />
      <ImportsThumbnail />
      <ReviewsSidebar />
    </CategoriesRegistryContext.Provider>
  );
}
