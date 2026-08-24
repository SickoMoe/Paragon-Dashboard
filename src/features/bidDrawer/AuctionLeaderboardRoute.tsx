import { useCallback, useEffect, useState } from "react";
import { Outlet, useLoaderData, useMatch, useNavigate, useParams } from "react-router-dom";
import { BidsPanel } from "./BidsPanel";
import type {
  AuctionLeaderboardDTO,
  BidDTO,
} from "../auctions/services/auctionBidApi";
import {
  fetchAuctionBids,
  recordAdminBid,
  voidAuctionBid,
} from "../auctions/services/auctionBidApi";
import { useAuctionRealtime } from "../auctions/hooks/useAuctionRealtime";
import type { AuctionRealtimeEvent } from "../auctions/services/auctionRealtime";

export default function AuctionLeaderboardRoute() {
  const navigate = useNavigate();
  const { auctionId } = useParams<{ auctionId: string }>();
  const initialLeaderboard = useLoaderData() as AuctionLeaderboardDTO;
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard);
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const isBidOpen = useMatch("/auctions/:auctionId/leaderboard/:bidId");

  useEffect(() => {
    setLeaderboard(initialLeaderboard);
  }, [initialLeaderboard]);

  const refreshManagementView = useCallback(async () => {
    if (!auctionId) return;
    try {
      setLeaderboard(await fetchAuctionBids(auctionId));
    } catch {
      // Keep the latest visible state; manual actions still surface errors.
    }
  }, [auctionId]);

  const handleRealtimeEvent = useCallback(
    (event: AuctionRealtimeEvent) => {
      if (!auctionId || event.auctionId !== auctionId) return;
      const realtimeLeaderboard = event.payload?.leaderboard;
      if (realtimeLeaderboard) {
        setLeaderboard(realtimeLeaderboard);
      }
      if (
        event.type === "bid.created" ||
        event.type === "auction.leaderboardUpdated"
      ) {
        void refreshManagementView();
      }
    },
    [auctionId, refreshManagementView],
  );

  useAuctionRealtime(handleRealtimeEvent);

  const handleRecordBid = async (input: {
    bidderProfileId: string;
    amount: number;
    adminNote?: string;
  }) => {
    if (!auctionId) return;
    setMutating(true);
    setMutationError(null);
    try {
      setLeaderboard(await recordAdminBid(auctionId, input));
    } catch (cause) {
      setMutationError(
        cause instanceof Error ? cause.message : "Unable to record bid",
      );
      throw cause;
    } finally {
      setMutating(false);
    }
  };

  const handleVoidBid = async (bid: BidDTO) => {
    if (!auctionId) return;
    const reason = window.prompt(
      `Why should the bid for ${Number(bid.amount).toLocaleString()} be voided?`,
    )?.trim();
    if (!reason) return;

    setMutating(true);
    setMutationError(null);
    try {
      setLeaderboard(await voidAuctionBid(auctionId, bid.id, reason));
    } catch (cause) {
      setMutationError(
        cause instanceof Error ? cause.message : "Unable to void bid",
      );
    } finally {
      setMutating(false);
    }
  };

  if (!auctionId) return null;

  return (
    <>
      <BidsPanel
        loading={false}
        mutating={mutating}
        error={mutationError}
        leaderboard={leaderboard}
        onClose={() => navigate(`/auctions/${auctionId}`)}
        onSelectBid={(bid: BidDTO) => {
          navigate(`/auctions/${auctionId}/leaderboard/${bid.id}`);
        }}
        onRecordBid={handleRecordBid}
        onVoidBid={handleVoidBid}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: isBidOpen ? "auto" : "none",
          zIndex: 70,
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 420,
            background: "var(--dash-card)",
            borderLeft: "1px solid var(--dash-border)",
            boxShadow: "var(--dash-shadow-lg)",
            transform: isBidOpen ? "translateX(0)" : "translateX(100%)",
            opacity: isBidOpen ? 1 : 0,
            transition: "transform 220ms ease, opacity 160ms ease",
          }}
        >
          <Outlet context={leaderboard.bids} />
        </div>
      </div>
    </>
  );
}
