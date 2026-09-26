import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLoaderData, useMatch, useNavigate, useParams } from "react-router-dom";
import { BidsPanel } from "./BidsPanel";
import type { AuctionLeaderboardDTO, BidDTO } from "../auctions/services/auctionBidApi";
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

  const version = useRef(0);
  const mutationInFlight = useRef(false);
  const refreshManagementView = useCallback(async () => {
    if (!auctionId || mutationInFlight.current) return;
    const call = ++version.current;
    try {
      const next = await fetchAuctionBids(auctionId);
      if (call === version.current) setLeaderboard(next);
    } catch {
      // Keep the latest visible state; manual actions still surface errors.
    }
  }, [auctionId]);

  const handleRealtimeEvent = useCallback(
    (event: AuctionRealtimeEvent) => {
      if (!auctionId || (event.auctionId && event.auctionId !== auctionId)) return;
      // Realtime data is anonymized for public viewers; retain the admin contract.
      if (
        [
          "bid.created",
          "auction.leaderboardUpdated",
          "auction.statusChanged",
          "auction.updated",
        ].includes(event.type)
      ) {
        void refreshManagementView();
      }
    },
    [auctionId, refreshManagementView],
  );

  useAuctionRealtime(handleRealtimeEvent);
  useEffect(() => {
    const refresh = () => void refreshManagementView();
    const timer = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    return () => {
      version.current++;
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [refreshManagementView]);

  const handleRecordBid = async (input: {
    bidderProfileId: string;
    amount: number;
    adminNote?: string;
  }) => {
    if (!auctionId) return;
    mutationInFlight.current = true;
    version.current++;
    setMutating(true);
    setMutationError(null);
    try {
      setLeaderboard(await recordAdminBid(auctionId, input));
    } catch (cause) {
      setMutationError(cause instanceof Error ? cause.message : "Unable to record bid");
      throw cause;
    } finally {
      mutationInFlight.current = false;
      setMutating(false);
    }
  };

  const handleVoidBid = async (bid: BidDTO) => {
    if (!auctionId) return;
    const reason = window
      .prompt(`Why should the bid for ${Number(bid.amount).toLocaleString()} be voided?`)
      ?.trim();
    if (!reason) return;

    mutationInFlight.current = true;
    version.current++;
    setMutating(true);
    setMutationError(null);
    try {
      setLeaderboard(await voidAuctionBid(auctionId, bid.id, reason));
    } catch (cause) {
      setMutationError(cause instanceof Error ? cause.message : "Unable to void bid");
    } finally {
      mutationInFlight.current = false;
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
          <Outlet context={[...leaderboard.bids, ...(leaderboard.voidedBids || [])]} />
        </div>
      </div>
    </>
  );
}
