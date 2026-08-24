// src/routes/dashboard/components/auctionDrawer/ui/styles.ts
import type React from "react";

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 10px",
  borderRadius: 8,
  border: "1px solid var(--dash-border)",
  background: "var(--dash-input)",
  color: "var(--dash-ink)",
  fontSize: 14,
  outline: "none",
};

export const primaryBtn: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--dash-primary)",
  background: "var(--dash-primary)",
  color: "var(--dash-primary-fg)",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

export const secondaryBtn: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--dash-border)",
  background: "var(--dash-card)",
  color: "var(--dash-ink)",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

export const dangerBtn: React.CSSProperties = {
  ...secondaryBtn,
  color: "var(--dash-danger)",
  borderColor: "rgba(212, 24, 61, 0.28)",
};
