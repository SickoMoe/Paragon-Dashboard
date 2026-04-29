// components/auctionDrawer/AuctionEditPanel.tsx
import React from "react";

type Props = {
  title: string;
  setTitle: (v: string) => void;

  startingBid: string;
  setStartingBid: (v: string) => void;

  increment: string;
  setIncrement: (v: string) => void;

  startDate: string;
  setStartDate: (v: string) => void;

  endDate: string;
  setEndDate: (v: string) => void;

  loading: boolean;
  onSave: () => void;
  onCancel: () => void;
};

export function AuctionEditPanel({
  title,
  setTitle,
  startingBid,
  setStartingBid,
  increment,
  setIncrement,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  loading,
  onSave,
  onCancel,
}: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <h3 style={{ margin: 0 }}>Edit auction</h3>

      <Field label="Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      <Field label="Starting bid">
        <input
          inputMode="numeric"
          value={startingBid}
          onChange={(e) => setStartingBid(e.target.value)}
        />
      </Field>

      <Field label="Increment">
        <input
          inputMode="numeric"
          value={increment}
          onChange={(e) => setIncrement(e.target.value)}
        />
      </Field>

      <Field label="Start date">
        <input
          type="datetime-local"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </Field>

      <Field label="End date">
        <input
          type="datetime-local"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </Field>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={onSave} disabled={loading}>
          {loading ? "Saving…" : "Save"}
        </button>
        <button onClick={onCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, color: "#6b7280" }}>{label}</label>
      {children}
    </div>
  );
}