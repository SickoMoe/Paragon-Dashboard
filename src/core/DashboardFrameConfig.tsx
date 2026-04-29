import type React from "react";

export type DashboardFrameConfig = {
  title: string;
  subtitle?: React.ReactNode;
  tabs?: React.ReactNode;
  toolbar?: React.ReactNode;
  action?: React.ReactNode;
};