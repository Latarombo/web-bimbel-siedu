'use client';

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';

export type HeaderActionType = 'create' | 'camera' | 'attendance';

export interface HeaderAction {
  type: HeaderActionType;
  label: string;
  onClick?: () => void;
  href?: string;
}

interface TeacherHeaderActionContextValue {
  action: HeaderAction | null;
  setAction: (action: HeaderAction | null) => void;
}

const TeacherHeaderActionContext = createContext<TeacherHeaderActionContextValue>({
  action: null,
  setAction: () => {},
});

export function TeacherHeaderActionProvider({ children }: { children: React.ReactNode }) {
  const [action, setAction] = useState<HeaderAction | null>(null);

  const value = useMemo(() => ({ action, setAction }), [action]);

  return (
    <TeacherHeaderActionContext.Provider value={value}>
      {children}
    </TeacherHeaderActionContext.Provider>
  );
}

export function useTeacherHeaderAction() {
  return useContext(TeacherHeaderActionContext);
}

export function useSetTeacherHeaderAction(actionConfig: HeaderAction | null) {
  const { setAction } = useTeacherHeaderAction();

  useEffect(() => {
    setAction(actionConfig);
    return () => {
      setAction(null);
    };
  }, [actionConfig, setAction]);
}
