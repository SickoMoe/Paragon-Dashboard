import { ReactNode, useEffect } from "react";
import { DashboardFrameConfig } from "../DashboardFrameConfig";
import { useDashboardFrame } from "../frameContext";


type Props = DashboardFrameConfig & {
  children?: ReactNode;
};

export function DashboardFrame(props: Props) {
  const { setFrame, resetFrame } = useDashboardFrame();

  useEffect(() => {
    setFrame(props);
    return resetFrame;
  }, [props.title, props.subtitle, props.tabs, props.toolbar, props.action]);

  return null; // important: frame is layout-level, not visual here
}