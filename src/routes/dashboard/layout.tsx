// src/core/layouts/DashboardLayout.tsx
import { Outlet } from "react-router-dom";
import { useDashboardFrame } from "../../core/frameContext";
import Navbar from "../../core/layout/navbar/Navbar";
import "../../style/DashboardShell.css";

export default function DashboardLayout() {
  const { frame } = useDashboardFrame();

  return (
    <div className="dashShell">
      <Navbar />

      <div className="dashShell__body">
        <div className="dashShell__header">
          <div>
            <h1 className="dashShell__title">{frame.title}</h1>
            {frame.subtitle ? (
              <p className="dashShell__subtitle">
                {frame.subtitle}
              </p>
            ) : null}
          </div>

          {frame.action ? <div className="dashShell__action">{frame.action}</div> : null}
        </div>

        {frame.tabs ? <div className="dashShell__tabs">{frame.tabs}</div> : null}
        {frame.toolbar ? (
          <div className="dashShell__toolbar">{frame.toolbar}</div>
        ) : null}

        <div className="dashShell__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
