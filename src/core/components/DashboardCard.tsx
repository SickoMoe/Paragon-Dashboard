// src/routes/dashboard/components/DashboardCard.tsx
import React from "react";

export function DashboardCard(props: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 14,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontWeight: 700 }}>{props.title}</div>
        <div style={{ marginLeft: "auto" }}>{props.right}</div>
      </div>
      {props.children}
    </section>
  );
}