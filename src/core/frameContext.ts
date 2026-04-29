// src/core/DashboardFrameContext.tsx
import { createContext, useContext } from "react";
import { DashboardFrameConfig } from "./DashboardFrameConfig";

export type DashboardFrameApi = {
  frame: DashboardFrameConfig;
  setFrame: (next: DashboardFrameConfig) => void;
  resetFrame: () => void;
};

export const DashboardFrameContext = createContext<DashboardFrameApi | null>(null);

export function useDashboardFrame() {
  const ctx = useContext(DashboardFrameContext);
  if (!ctx) {
    throw new Error("useDashboardFrame must be used inside DashboardFrameContext.Provider");
  }
  return ctx;
}