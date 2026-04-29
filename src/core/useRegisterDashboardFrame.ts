import { useEffect } from "react";
import { useDashboardFrame } from "./frameContext";
import { DashboardFrameConfig } from "./DashboardFrameConfig";

export function useRegisterDashboardFrame(frame: any) {
  const { setFrame } = useDashboardFrame();

  useEffect(() => {
    setFrame(frame);
  }, [frame, setFrame]);
}