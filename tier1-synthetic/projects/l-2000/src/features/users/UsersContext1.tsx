import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import UsersStepper1 from './UsersStepper1';
import DocumentsAccordion from '../documents/DocumentsAccordion';

interface UsersContext1State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface UsersContext1ContextValue {
  state: UsersContext1State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const UsersContext1Context = createContext<UsersContext1ContextValue | null>(null);

export function useUsersContext1() {
  const ctx = useContext(UsersContext1Context);
  if (!ctx) {
    throw new Error(`useUsersContext1 must be used within a UsersContext1`);
  }
  return ctx;
}

interface UsersContext1Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function UsersContext1({
  children,
  initialActive = false,
  initialLabel = 'UsersContext1',
}: UsersContext1Props) {
  const [state, setState] = useState<UsersContext1State>({
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

  const contextValue = useMemo<UsersContext1ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <UsersContext1Context.Provider value={contextValue}>
      {children}
      <UsersStepper1 />
      <DocumentsAccordion />
    </UsersContext1Context.Provider>
  );
}
