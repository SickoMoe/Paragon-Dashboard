// src/routes/dashboard/components/auctionDrawer/sections/ActionsSection.tsx

import { AuctionLeaderboardDTO } from "../../auctions/services/auctionBidApi";
import { AuctionOverview } from "../../auctions/types";
import { BidsPanel } from "../../bidDrawer/BidsPanel";
import { primaryBtn, secondaryBtn, dangerBtn } from "../styles";
type Props = {
  row: AuctionOverview;
  loading: boolean;

  handlePublish: () => void;
  handleEnd: () => void;
  handleDeleteClick: () => void;

  handleOpenBids: () => void;
  handleCloseBids: () => void;
  bidsOpen: boolean;
  bidsLoading: boolean;
  bidsError: string | null;
  leaderboard: AuctionLeaderboardDTO | null;
};

export function ActionsSection({
  row,
  loading,
  handlePublish,
  handleEnd,
  handleDeleteClick,
  handleOpenBids,
  handleCloseBids,
  bidsOpen,
  bidsLoading,
  bidsError,
  leaderboard,
}: Props) {
  const canPublish = row.auction.status === "scheduled";

  return (
    <section style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12, marginTop: 12 }}>
      <h4 style={{ margin: "0 0 8px" }}>Actions</h4>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {canPublish && (
          <button onClick={handlePublish} disabled={loading} style={primaryBtn}>
            {loading ? "Publishing..." : "Publish Auction"}
          </button>
        )}

        {row.auction.status === "live" && (
          <button onClick={handleEnd} disabled={loading} style={secondaryBtn}>
            {loading ? "Ending..." : "End Auction"}
          </button>
        )}

        <button onClick={handleOpenBids} style={secondaryBtn}>
          View bids
        </button>

        <button onClick={handleDeleteClick} disabled={loading} style={dangerBtn}>
          {loading ? "Deleting..." : "🗑 Delete Auction"}
        </button>

{bidsOpen && leaderboard && (
  <BidsPanel
    onClose={handleCloseBids}
    loading={bidsLoading}
    error={bidsError}
    leaderboard={leaderboard}
    onSelectBid={handleOpenBids}
  />
)}
      </div>
    </section>
  );
}