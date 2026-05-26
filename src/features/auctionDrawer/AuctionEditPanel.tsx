// components/auctionDrawer/AuctionEditPanel.tsx
import React from "react";

type Props = {
  startingBid: string;
  setStartingBid: (v: string) => void;

  increment: string;
  setIncrement: (v: string) => void;

  startDate: string;
  setStartDate: (v: string) => void;

  endDate: string;
  setEndDate: (v: string) => void;
};

export function AuctionEditPanel({
  startingBid,
  setStartingBid,
  increment,
  setIncrement,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#111827",
          marginBottom: 2,
        }}
      >
        Auction details
      </div>

      <Field label="Starting bid">
        <input inputMode="numeric" value={startingBid} onChange={(e) => setStartingBid(e.target.value)} />
      </Field>

      <Field label="Increment">
        <input inputMode="numeric" value={increment} onChange={(e) => setIncrement(e.target.value)} />
      </Field>

      <Field label="Start date">
        <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </Field>

      <Field label="End date">
        <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </Field>

    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#6b7280",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
