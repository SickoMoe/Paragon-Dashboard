import { Outlet, useLoaderData, useMatch, useNavigate, useParams } from "react-router-dom";
import { BidsPanel } from "./BidsPanel";
import { AuctionLeaderboardDTO, BidDTO } from "../auctions/services/auctionBidApi";
export default function AuctionLeaderboardRoute() {
  const navigate = useNavigate();
  const { auctionId } = useParams<{ auctionId: string }>();
  const leaderboard = useLoaderData() as AuctionLeaderboardDTO;

  if (!auctionId) return null;
const isBidOpen = useMatch("/auctions/:auctionId/leaderboard/:bidId");
  return (
    <>
    <BidsPanel
      loading={false}
      error={null}
      leaderboard={leaderboard}
      onClose={() => navigate(`/auctions/${auctionId}`)}
      onSelectBid={(bid:BidDTO) => {
        navigate(`/auctions/${auctionId}/leaderboard/${bid.id}`);
      }}
    />
       {/* Animated overlay layer */}
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
            background: "#fff",
            boxShadow: "-12px 0 30px rgba(0,0,0,0.25)",
            transform: isBidOpen
              ? "translateX(0)"
              : "translateX(100%)",
            opacity: isBidOpen ? 1 : 0,
            transition: "transform 220ms ease, opacity 160ms ease",
          }}
        >     
  <Outlet context={leaderboard
  .bids
  }/>
  </div>
    </div>

</>
  );
}