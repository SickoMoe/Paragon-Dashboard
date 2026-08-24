import React from "react";
import { AuctionOverview } from "../auctions/types";
import { getListingThumbnail } from "../auctions/utils/listingMedia";
import type { IAuction } from "../../interfaces/IAuction";

type Props = {
  row: AuctionOverview;
  loading?: boolean;
  error?: string | null;
  onViewBids: () => void;
  onEdit: () => void;
  onSubmit: () => void;
  onWithdraw: () => void;
  onApprove: () => void;
  onRequestChanges: () => void;
  onReject: () => void;
  onPublish: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onCancelAuction: () => void;
  onArchive: () => void;
  onRelist: () => void;
  onDelete: () => void;
};

export function AuctionOverviewPanel({
  row,
  onViewBids,
  onEdit,
  onSubmit,
  onWithdraw,
  onApprove,
  onRequestChanges,
  onReject,
  onPublish,
  onPause,
  onResume,
  onEnd,
  onCancelAuction,
  onArchive,
  onRelist,
  onDelete,
  loading,
  error,
}: Props) {
  const img = getListingThumbnail(row.listing);
  const title = row.listing?.basicInformation?.title ?? "Untitled listing";
  const loc = row.listing?.basicInformation?.location;
  const location = loc ? [loc.city, loc.state].filter(Boolean).join(", ") : "—";
  const { auction } = row;
  const status = auction.status;
  const lifecycleNote = getLifecycleNote(auction);
  const canArchive = status === "ended" || status === "cancelled" || status === "rejected";
  const canRelist = status === "ended" || status === "cancelled" || status === "rejected" || status === "archived";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ height: 180, borderRadius: 12, overflow: "hidden", background: "var(--dash-surface)" }}>
        {img && <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      </div>

      <div>
        <div style={{ fontFamily: "var(--dash-font-display)", fontSize: 22, fontWeight: 600, color: "var(--dash-ink)" }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--dash-muted)" }}>{location}</div>
      </div>

      <span style={{ alignSelf: "flex-start", border: "1px solid var(--dash-border)", background: "var(--dash-surface)", color: "var(--dash-ink)", borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 700, textTransform: "capitalize" }}>{formatStatus(status)}</span>
      {lifecycleNote ? <div style={{ color: "var(--dash-muted)", fontSize: 13 }}>{lifecycleNote}</div> : null}
      {error ? (
        <div style={{ color: "var(--dash-danger)", fontSize: 13, fontWeight: 600 }}>{error}</div>
      ) : null}

      <div>
        <SummaryItem label="Starting bid" value={`$${auction.startingBid ?? 0}`} />
        <SummaryItem label="Increment" value={`$${auction.rules?.bidIncrement ?? 0}`} />
        <SummaryItem label="Start" value={auction.startDate ?? ""} />
        <SummaryItem label="End" value={auction.endDate ?? ""} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button style={btn.secondary} onClick={onViewBids}>
          View bids
        </button>
        <button style={btn.primary} onClick={onEdit}>
          Edit
        </button>

        {status === "draft" && (
          <button style={btn.primary} onClick={onSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit for approval"}
          </button>
        )}

        {status === "pending_approval" && (
          <>
            <button style={btn.primary} onClick={onApprove} disabled={loading}>
              {loading ? "Approving..." : "Approve auction"}
            </button>
            <button style={btn.secondary} onClick={onRequestChanges} disabled={loading}>
              Request changes
            </button>
            <button style={btn.danger} onClick={onReject} disabled={loading}>
              Reject auction
            </button>
            <button style={btn.secondary} onClick={onWithdraw} disabled={loading}>
              Withdraw
            </button>
          </>
        )}

        {status === "changes_requested" && (
          <>
            <button style={btn.primary} onClick={onSubmit} disabled={loading}>
              Resubmit for approval
            </button>
            <button style={btn.danger} onClick={onCancelAuction} disabled={loading}>
              Cancel auction
            </button>
          </>
        )}

        {status === "scheduled" && (
          <>
            <button style={btn.primary} onClick={onPublish} disabled={loading}>
              {loading ? "Publishing..." : "Publish auction"}
            </button>
            <button style={btn.danger} onClick={onCancelAuction} disabled={loading}>
              Cancel auction
            </button>
          </>
        )}

        {status === "live" && (
          <>
            <button style={btn.secondary} onClick={onPause} disabled={loading}>
              Pause auction
            </button>
            <button style={btn.secondary} onClick={onEnd} disabled={loading}>
              {loading ? "Ending..." : "End auction"}
            </button>
            <button style={btn.danger} onClick={onCancelAuction} disabled={loading}>
              Cancel auction
            </button>
          </>
        )}

        {status === "paused" && (
          <>
            <button style={btn.primary} onClick={onResume} disabled={loading}>
              {loading ? "Resuming..." : "Resume auction"}
            </button>
            <button style={btn.secondary} onClick={onEnd} disabled={loading}>
              End auction
            </button>
            <button style={btn.danger} onClick={onCancelAuction} disabled={loading}>
              Cancel auction
            </button>
          </>
        )}

        {canArchive && (
          <button style={btn.secondary} onClick={onArchive} disabled={loading}>
            Archive auction
          </button>
        )}

        {canRelist && (
          <button style={btn.primary} onClick={onRelist} disabled={loading}>
            Relist as new draft
          </button>
        )}

        <button style={btn.danger} onClick={onDelete} disabled={loading}>
          Delete / archive
        </button>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--dash-muted)" }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function formatStatus(status: IAuction["status"]) {
  return status.replace(/_/g, " ");
}

function getLifecycleNote(auction: IAuction) {
  const lifecycle = auction.lifecycle;
  if (auction.status === "changes_requested") return lifecycle?.changeReason;
  if (auction.status === "rejected") return lifecycle?.rejectedReason;
  if (auction.status === "paused") return lifecycle?.pauseReason;
  if (auction.status === "cancelled") return lifecycle?.cancelledReason;
  if (lifecycle?.relistedFromAuctionId) return `Relisted from ${lifecycle.relistedFromAuctionId}`;
  return "";
}

const btn: Record<string, React.CSSProperties> = {
  primary: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--dash-ink)",
    background: "var(--dash-ink)",
    color: "var(--dash-card)",
    cursor: "pointer",
    fontSize: 13,
  },
  secondary: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--dash-border)",
    background: "var(--dash-card)",
    color: "var(--dash-ink)",
    cursor: "pointer",
    fontSize: 13,
  },
  danger: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid rgba(212, 24, 61, 0.28)",
    background: "var(--dash-card)",
    color: "var(--dash-danger)",
    cursor: "pointer",
    fontSize: 13,
  },
};
