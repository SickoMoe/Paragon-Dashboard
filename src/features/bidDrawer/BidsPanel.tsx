import Drawer from "../../core/components/Drawer";
import { AuctionLeaderboardDTO } from "../auctions/services/auctionBidApi";

export function BidsPanel({
  onClose,
  loading,
  error,
  leaderboard,
  onSelectBid,
}: {
  onClose: () => void;
  loading: boolean;
  error: string | null;
  leaderboard: AuctionLeaderboardDTO;
  onSelectBid: (bid: any) => void;
}) {
  return (
    <Drawer
      open
      onClose={onClose}
      title="Bids"
      size={420}
      zIndex={60}
    >
      <div style={{ marginTop: 12, fontSize: 13, color: "#6b7280" }}>
        {leaderboard && (
          <div style={{ marginBottom: 10 }}>
            <div>
              Current:{" "}
              <strong>${Number(leaderboard.currentBid ?? 0).toLocaleString()}</strong>
            </div>
            <div>Opening: ${Number(leaderboard.openingBid ?? 0).toLocaleString()}</div>
            <div>Increment: ${Number(leaderboard.incrementAmount ?? 0).toLocaleString()}</div>
          </div>
        )}

        {loading && <div>Loading bids…</div>}
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}

        {!loading && !error && leaderboard?.bids?.length === 0 && <div>No bids yet.</div>}

        {!loading && !error && (leaderboard?.bids?.length ?? 0) > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {leaderboard.bids.map((b: any) => (
              <div
                key={b.id}
                onClick={() => onSelectBid(b)}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 10,
                  background: "#fff",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 600, color: "#111827" }}>
                    ${Number(b.amount ?? 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12 }}>
                    {b.createdAt ? new Date(b.createdAt).toLocaleString() : "—"}
                  </div>
                </div>
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  Bidder: {b.bidderProfileId}
                </div>
                {b.source && (
                  <div style={{ marginTop: 2, fontSize: 12 }}>Source: {b.source}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}