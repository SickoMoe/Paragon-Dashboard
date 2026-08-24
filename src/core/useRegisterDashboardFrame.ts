import { useEffect } from "react";
import { useDashboardFrame } from "./frameContext";
import type { DashboardFrameConfig } from "./DashboardFrameConfig";

export function useRegisterDashboardFrame(frame: DashboardFrameConfig) {
  const { setFrame } = useDashboardFrame();

  useEffect(() => {
    setFrame(frame);
  }, [frame, setFrame]);
}