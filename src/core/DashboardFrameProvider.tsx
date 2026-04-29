// src/core/DashboardFrameProvider.tsx
import React, { useCallback, useMemo, useState } from "react";
import { DashboardFrameConfig } from "./DashboardFrameConfig";
import { DashboardFrameContext } from "./frameContext";

const DEFAULT_FRAME: DashboardFrameConfig = {
  title: "Dashboard",
  subtitle: "",
  tabs: null,
  toolbar: null,
  action: null,
};

export function DashboardFrameProvider({ children }: { children: React.ReactNode }) {
  const [frame, setFrameState] = useState<DashboardFrameConfig>(DEFAULT_FRAME);

  const setFrame = useCallback((next: DashboardFrameConfig) => {
    setFrameState(next);
  }, []);

  const resetFrame = useCallback(() => {
    setFrameState(DEFAULT_FRAME);
  }, []);

  const value = useMemo(
    () => ({ frame, setFrame, resetFrame }),
    [frame, setFrame, resetFrame]
  );

  return (
    <DashboardFrameContext.Provider value={value}>
      {children}
    </DashboardFrameContext.Provider>
  );
}