import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import CategoriesAutocomplete1 from './CategoriesAutocomplete1';
import CategoriesTimePicker from './CategoriesTimePicker';
import CategoriesDatePicker from './CategoriesDatePicker';

interface CategoriesHOCState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface CategoriesHOCContextValue {
  state: CategoriesHOCState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const CategoriesHOCContext = createContext<CategoriesHOCContextValue | null>(null);

export function useCategoriesHOC() {
  const ctx = useContext(CategoriesHOCContext);
  if (!ctx) {
    throw new Error(`useCategoriesHOC must be used within a CategoriesHOC`);
  }
  return ctx;
}

interface CategoriesHOCProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function CategoriesHOC({
  children,
  initialActive = false,
  initialLabel = 'CategoriesHOC',
}: CategoriesHOCProps) {
  const [state, setState] = useState<CategoriesHOCState>({
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

  const contextValue = useMemo<CategoriesHOCContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <CategoriesHOCContext.Provider value={contextValue}>
      {children}
      <CategoriesAutocomplete1 />
      <CategoriesTimePicker />
      <CategoriesDatePicker />
    </CategoriesHOCContext.Provider>
  );
}
