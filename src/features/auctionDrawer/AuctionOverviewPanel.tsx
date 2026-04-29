import React from "react";
import { AuctionOverview } from "../auctions/types";

type Props = {
  row: AuctionOverview;
  loading?: boolean;
  onViewBids: () => void;
  onEdit: () => void;
  onEnd: () => void;
  onDelete: () => void;
};

export function AuctionOverviewPanel({
  row,
  onViewBids,
  onEdit,
  onEnd,
  onDelete,
  loading,
}: Props) {
  const img = row.listing?.media?.images?.[0];
  const title = row.listing?.basicInformation?.title ?? "Untitled listing";
  const loc = row.listing?.basicInformation?.location;
  const location = loc ? [loc.city, loc.state].filter(Boolean).join(", ") : "—";
  const { auction } = row;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ height: 180, borderRadius: 12, overflow: "hidden", background: "#f3f4f6" }}>
        {img && <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      </div>

      <div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 13, color: "#6b7280" }}>{location}</div>
      </div>

      <span >{auction.status}</span>

      <div>
        <SummaryItem label="Starting bid" value={`$${auction.startingBid ?? 0}`} />
        <SummaryItem label="Increment" value={`$${auction.rules?.bidIncrement ?? 0}`} />
        <SummaryItem label="Start" value={auction.startDate ?? ""} />
        <SummaryItem label="End" value={auction.endDate ?? ""} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button style={btn.secondary} onClick={onViewBids}>View bids</button>
        <button style={btn.primary} onClick={onEdit}>Edit auction</button>

        {auction.status === "live" && (
          <button style={btn.secondary} onClick={onEnd} disabled={loading}>
            End auction
          </button>
        )}

        <button style={btn.danger} onClick={onDelete} disabled={loading}>
          Delete auction
        </button>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#6b7280" }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}

const btn: Record<string, React.CSSProperties> = {
  primary: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
  },
  secondary: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#111827",
    cursor: "pointer",
    fontSize: 13,
  },
  danger: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #fecaca",
    background: "#fff",
    color: "#b91c1c",
    cursor: "pointer",
    fontSize: 13,
  },
};

