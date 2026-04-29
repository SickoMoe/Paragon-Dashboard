// src/core/layouts/DashboardLayout.tsx
import { Outlet } from "react-router-dom";
import { useDashboardFrame } from "../../core/frameContext";
import Navbar from "../../core/layout/navbar/Navbar";

export default function DashboardLayout() {
  const { frame } = useDashboardFrame();

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      {/* Full-width frame header */}
      <Navbar />

      {/* Page content area */}
      <div style={{ padding: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ margin: 0 }}>{frame.title}</h1>
            {frame.subtitle ? (
              <p
                style={{
                  margin: "6px 0 0",
                  color: "#6b7280",
                  fontSize: 13,
                }}
              >
                {frame.subtitle}
              </p>
            ) : null}
          </div>

          {frame.action ?? null}
        </div>

        {frame.tabs ? <div style={{ marginTop: 14 }}>{frame.tabs}</div> : null}
        {frame.toolbar ? (
          <div style={{ marginTop: 12 }}>{frame.toolbar}</div>
        ) : null}

        <div style={{ marginTop: 12 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}