import React from "react";
import type { IAuction } from "../../../interfaces/IAuction";
import { AuctionOverview } from "../types";



type Props = {
  rows: AuctionOverview[];
  onRowClick: (row: AuctionOverview) => void;
};

export function AuctionsTable({ rows, onRowClick }: Props) {
  return (
    <div style={styles.table}>
      <TableHeader />
      {rows.map((row) => (
        <TableRow key={row.auction.id} row={row} onClick={() => onRowClick(row)} />
      ))}
    </div>
  );
}

/* ───────────────────────────── Components ───────────────────────────── */

function TableHeader() {
  return (
    <div style={styles.headerRow}>
      <div>Status</div>
      <div>Property</div>
      <div>Schedule</div>
      <div style={styles.right}>Current Bid</div>
      <div style={styles.right}>Starting</div>
    </div>
  );
}

function TableRow({ row, onClick }: { row: AuctionOverview; onClick: () => void }) {
  const a = row.auction;
  const l = row.listing;

  const loc = l.basicInformation.location;
  const img = l.media.images?.[0] ?? "";

  return (
    <div style={styles.row} onClick={onClick} role="button" tabIndex={0}>
      {/* Status */}
      <div style={styles.statusCell}>
        <StatusDot status={a.status} />
        <span style={styles.muted}>{a.status}</span>
      </div>

      {/* Property */}
      <div style={styles.propertyCell}>
        <Thumb img={img} />
        <div>
          <div style={styles.primaryText}>{l.basicInformation.title}</div>
          <div style={styles.muted}>
            {loc.address}, {loc.city}, {loc.state} {loc.zipcode}
          </div>
          <div style={styles.muted}>Auction: {a.id}</div>
        </div>
      </div>

      {/* Schedule */}
      <div>
        <div style={styles.primaryText}>{formatDate(a.startDate)}</div>
        <div style={styles.muted}>{formatDate(a.endDate)}</div>
      </div>

      {/* Current bid (from row.bid) */}
      <div style={styles.moneyCell}>{formatMoney(row.bid.currentBid)}</div>

      {/* Starting bid (prefer auction.startingBid; fall back to bid.openingBid) */}
      <div style={styles.moneyCell}>
        {formatMoney(a.startingBid ?? row.bid.openingBid)}
      </div>
    </div>
  );
}

function Thumb({ img }: { img: string }) {
  return (
    <div style={styles.thumbWrap}>
      {img ? <img src={img} alt="" style={styles.thumbImg} /> : <div style={styles.thumbFallback} />}
    </div>
  );
}

function StatusDot({ status }: { status: IAuction["status"] }) {
  const color =
    status === "live"
      ? "#16a34a"
      : status === "scheduled"
      ? "#f59e0b"
      : status === "draft"
      ? "#6b7280"
      : status === "ended"
      ? "#111827"
      : "#ef4444";

  return <span style={{ width: 8, height: 8, borderRadius: 999, background: color, display: "inline-block" }} />;
}

/* ───────────────────────────── Helpers ───────────────────────────── */

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function formatMoney(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString()}`;
}

/* ───────────────────────────── Styles ───────────────────────────── */

const styles: Record<string, React.CSSProperties> = {
  table: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
  },
  headerRow: {
    display: "grid",
    gridTemplateColumns: "140px 2.5fr 2fr 1fr 1fr",
    gap: 12,
    padding: "10px 14px",
    fontSize: 12,
    color: "#6b7280",
    borderBottom: "1px solid #e5e7eb",
    background: "#fafafa",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "140px 2.5fr 2fr 1fr 1fr",
    gap: 12,
    padding: "12px 14px",
    borderBottom: "1px solid #f3f4f6",
    cursor: "pointer",
    alignItems: "center",
  },
  statusCell: { display: "flex", alignItems: "center", gap: 8 },
  propertyCell: { display: "flex", alignItems: "center", gap: 10 },
  right: { textAlign: "right" },
  moneyCell: { textAlign: "right", fontVariantNumeric: "tabular-nums" },
  thumbWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: "hidden",
    background: "#f3f4f6",
    flex: "0 0 auto",
  },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  thumbFallback: { width: "100%", height: "100%", background: "#e5e7eb" },
  primaryText: { fontSize: 13, color: "#111827" },
  muted: { fontSize: 12, color: "#6b7280", marginTop: 2 },
};