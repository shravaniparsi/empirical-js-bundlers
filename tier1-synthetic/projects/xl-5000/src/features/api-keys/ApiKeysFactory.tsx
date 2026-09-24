import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import ApiKeysAvatar1 from './ApiKeysAvatar1';
import ApiKeysMeter from './ApiKeysMeter';
import ApiKeysColorPicker1 from './ApiKeysColorPicker1';
import ProfileStepper3 from '../profile/ProfileStepper3';

interface ApiKeysFactoryState {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ApiKeysFactoryContextValue {
  state: ApiKeysFactoryState;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ApiKeysFactoryContext = createContext<ApiKeysFactoryContextValue | null>(null);

export function useApiKeysFactory() {
  const ctx = useContext(ApiKeysFactoryContext);
  if (!ctx) {
    throw new Error(`useApiKeysFactory must be used within a ApiKeysFactory`);
  }
  return ctx;
}

interface ApiKeysFactoryProps {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ApiKeysFactory({
  children,
  initialActive = false,
  initialLabel = 'ApiKeysFactory',
}: ApiKeysFactoryProps) {
  const [state, setState] = useState<ApiKeysFactoryState>({
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

  const contextValue = useMemo<ApiKeysFactoryContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <ApiKeysFactoryContext.Provider value={contextValue}>
      {children}
      <ApiKeysAvatar1 />
      <ApiKeysMeter />
      <ApiKeysColorPicker1 />
      <ProfileStepper3 />
    </ApiKeysFactoryContext.Provider>
  );
}
