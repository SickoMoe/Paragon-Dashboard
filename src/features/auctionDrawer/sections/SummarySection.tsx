// src/routes/dashboard/components/auctionDrawer/sections/SummaryHeader.tsx
import React from "react";
import { AuctionOverview } from "../../auctions/types";

type Props = {
  row: AuctionOverview;
  onClose: () => void;
  startLabel: string;
  endLabel: string;

  loading: boolean;
  onViewBids: () => void;
};

export function SummarySection({
  row,
  onClose,
  startLabel,
  endLabel,
  loading,
  onViewBids,
}: Props) {
  const img = row.listing?.media?.images?.[0] ?? "";
  const bi = row.listing?.basicInformation;
  const loc = bi?.location;

  const title = bi?.title ?? "Untitled listing";
  const locationLine = loc
    ? [loc.address, loc.city, loc.state, loc.zipcode].filter(Boolean).join(", ")
    : "—";

  return (
    <section style={styles.wrap}>
      
      <div style={styles.imageWrap}>
        {img ? <img src={img} alt="" style={styles.image} /> : <div style={styles.fallback} />}

        <button onClick={onClose} style={styles.closeBtn} aria-label="Close">
          ×
        </button>
      </div>

      <div style={styles.body}>
        <div style={styles.topRow}>
          <div>
            <div style={styles.title}>{title}</div>
            <div style={styles.muted}>{locationLine}</div>
            <div style={styles.muted}>Auction: {row.auction.id}</div>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={styles.badge}>{row.auction.status}</span>
          </div>
        </div>

        <div style={styles.metaRow}>
          <div style={styles.metaItem}>
            <div style={styles.metaLabel}>Start</div>
            <div style={styles.metaValue}>{startLabel}</div>
          </div>
          <div style={styles.metaItem}>
            <div style={styles.metaLabel}>End</div>
            <div style={styles.metaValue}>{endLabel}</div>
          </div>
        </div>

        <div style={styles.actionsRow}>
          <button onClick={onViewBids} style={btn.secondary}>
            View bids
          </button>
          <button disabled={loading} style={btn.ghost} title="Coming next">
            Edit
          </button>
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { borderRadius: 16, overflow: "hidden", border: "1px solid #eef0f4", background: "#fff" },
  imageWrap: { position: "relative", height: 170, background: "#f3f4f6" },
  image: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  fallback: { width: "100%", height: "100%" },

  closeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.55)",
    background: "rgba(17,24,39,0.55)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 20,
    lineHeight: "34px",
  },

  body: { padding: 14 },
  topRow: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  title: { fontSize: 16, fontWeight: 800, color: "#111827" },
  muted: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  badge: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    border: "1px solid #eef0f4",
    background: "#f9fafb",
    color: "#111827",
    fontWeight: 700,
    textTransform: "capitalize",
  },

  metaRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 },
  metaItem: { border: "1px solid #eef0f4", borderRadius: 12, padding: 10, background: "#fff" },
  metaLabel: { fontSize: 11, color: "#6b7280" },
  metaValue: { fontSize: 12, color: "#111827", marginTop: 4 },

  actionsRow: { display: "flex", gap: 8, marginTop: 12 },
};

const btn: Record<string, React.CSSProperties> = {
  secondary: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #eef0f4",
    background: "#fff",
    color: "#111827",
    cursor: "pointer",
    fontSize: 13,
    width: "100%",
  },
  ghost: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid transparent",
    background: "#f9fafb",
    color: "#6b7280",
    cursor: "not-allowed",
    fontSize: 13,
    width: "100%",
  },
};