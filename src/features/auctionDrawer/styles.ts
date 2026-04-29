// src/routes/dashboard/components/auctionDrawer/ui/styles.ts
import type React from "react";

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: 14,
};

export const primaryBtn: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontSize: 14,
  cursor: "pointer",
};

export const secondaryBtn: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
  fontSize: 14,
  cursor: "pointer",
};

export const dangerBtn: React.CSSProperties = {
  ...secondaryBtn,
  color: "#b91c1c",
  borderColor: "#fecaca",
};