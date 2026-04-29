// src/routes/dashboard/components/auctionDrawer/sections/HeroSection.tsx
import React from "react";
import { AuctionOverview } from "../../auctions/types";

type Props = {
  row: AuctionOverview;
  onClose: () => void;

  loading: boolean;
  canPublish: boolean;
  onPublish: () => void;
  onEnd: () => void;
  onViewBids: () => void;
};

export function HeroSection({
  row,
  onClose,
  loading,
  canPublish,
  onPublish,
  onEnd,
  onViewBids,
}: Props) {
  const img = row.listing?.media?.images?.[0] ?? "";
  const title = row.listing?.basicInformation?.title ?? "Untitled listing";

  const loc = row.listing?.basicInformation?.location;
  const locationLine = loc
    ? [loc.address, loc.city, loc.state, loc.zipcode].filter(Boolean).join(", ")
    : "—";

  return (
    <section style={styles.wrap}>
      <div style={styles.imageWrap}>
        {img ? <img src={img} alt="" style={styles.image} /> : <div style={styles.imageFallback} />}

        <button onClick={onClose} style={styles.closeBtn} aria-label="Close">
          ×
        </button>

        <div style={styles.badge}>{row.auction.status}</div>
      </div>

      <div style={styles.body}>
        <div style={styles.title}>{title}</div>
        <div style={styles.muted}>{locationLine}</div>
        <div style={styles.muted}>Auction: {row.auction.id}</div>

        <div style={styles.actionsRow}>
          {canPublish ? (
            <button onClick={onPublish} disabled={loading} style={btn.primary}>
              {loading ? "Publishing…" : "Publish"}
            </button>
          ) : null}

          {row.auction.status === "live" ? (
            <button onClick={onEnd} disabled={loading} style={btn.secondary}>
              {loading ? "Ending…" : "End"}
            </button>
          ) : null}

          <button onClick={onViewBids} style={btn.secondary}>
            View bids
          </button>
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid #eef0f4",
    background: "#fff",
  },

  imageWrap: {
    position: "relative",
    height: 160,
    background: "#f3f4f6",
  },
  image: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  imageFallback: { width: "100%", height: "100%" },

  closeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 3,
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

  badge: {
    position: "absolute",
    left: 10,
    bottom: 10,
    zIndex: 3,
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    border: "1px solid rgba(255,255,255,0.55)",
    background: "rgba(255,255,255,0.92)",
    color: "#111827",
    fontWeight: 800,
    textTransform: "capitalize",
  },

  body: {
    padding: 14,
    borderTop: "1px solid #eef0f4",
  },

  title: { fontSize: 16, fontWeight: 800, color: "#111827" },
  muted: { fontSize: 12, color: "#6b7280", marginTop: 4 },

  actionsRow: {
    marginTop: 12,
    display: "flex",
    gap: 8,
  },
};

const btn: Record<string, React.CSSProperties> = {
  primary: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },
  secondary: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #eef0f4",
    background: "#fff",
    color: "#111827",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },
};