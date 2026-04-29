import { Outlet, useLoaderData, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { BidDetailPanel } from "./BidDetailPanel";
import { AuctionLeaderboardDTO, BidDTO } from "../auctions/services/auctionBidApi";

export default function BidDetailRoute() {
  const navigate = useNavigate();
  const { auctionId, bidId } = useParams<{
    auctionId: string;
    bidId: string;
  }>();

const bids = useOutletContext() as BidDTO[];
  const bid = bids.find(a => a.id === bidId);

  if (!bid) return null;

  return (

    <BidDetailPanel
      bid={bid}
      onClose={() => navigate(`/auctions/${auctionId}/leaderboard`)}
    />
  
  );
}