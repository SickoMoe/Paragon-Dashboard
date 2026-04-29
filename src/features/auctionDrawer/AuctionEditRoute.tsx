// routes/auctions/AuctionEditRoute.tsx
import { useNavigate, useParams } from "react-router-dom";
import { useAuctionDrawerController } from "../auctions/hooks/useAuctionDrawerController";
import { AuctionEditPanel } from "./AuctionEditPanel";
import { useDashboardPageContext } from "../../routes/auctions/auctionPageContext";

export default function AuctionEditRoute() {
  const navigate = useNavigate();
  const { auctionId } = useParams<{ auctionId: string }>();
  const { auctions } = useDashboardPageContext();

  const row = auctions.find((a) => a.auction.id === auctionId);
  if (!row) return null;

  const ctrl = useAuctionDrawerController(row, () => {}, undefined, () =>
    navigate(`/auctions/${auctionId}`)
  );

  return (
    <AuctionEditPanel 
      title={ctrl.title}
      setTitle={ctrl.setTitle}
      startingBid={ctrl.startingBid}
      setStartingBid={ctrl.setStartingBid}
      increment={ctrl.increment}
      setIncrement={ctrl.setIncrement}
      startDate={ctrl.startDate}
      setStartDate={ctrl.setStartDate}
      endDate={ctrl.endDate}
      setEndDate={ctrl.setEndDate}
      loading={ctrl.loading}
      onSave={ctrl.handleSaveAll}
      onCancel={() => navigate(`/auctions/${auctionId}`)}
    />
  );
}