// routes/auctions/AuctionOverviewRoute.tsx
import { useNavigate, useParams } from "react-router-dom";
import { useDashboardPageContext } from "../../routes/auctions/auctionPageContext";
import { AuctionOverviewPanel } from "./AuctionOverviewPanel";

export default function AuctionOverviewRoute() {
  const navigate = useNavigate();
  const { auctionId } = useParams<{ auctionId: string }>();
  const { auctions } = useDashboardPageContext();

  if (!auctionId) return null;

  const row = auctions.find((a) => a.auction.id === auctionId);
  if (!row) return null;
  return (
    <AuctionOverviewPanel
      row={row}
      onViewBids={() => navigate("leaderboard")}
      onEdit={() => navigate("edit")}
      onEnd={() => console.log("end")}
      onDelete={() => console.log("delete")}
    />
  );
}