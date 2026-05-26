// routes/auctions/AuctionEditRoute.tsx
import { useNavigate, useParams, useRevalidator } from "react-router-dom";
import { useAuctionDrawerController } from "../auctions/hooks/useAuctionDrawerController";
import { AuctionEditPanel } from "./AuctionEditPanel";
import { ListingSection } from "./sections/ListingSection";
import { useDashboardPageContext } from "../../routes/auctions/auctionPageContext";

export default function AuctionEditRoute() {
  const navigate = useNavigate();
  const { revalidate } = useRevalidator();
  const { auctionId } = useParams<{ auctionId: string }>();
  const { auctions, handleUpdate } = useDashboardPageContext();

  const row = auctions.find((a) => a.auction.id === auctionId);
  if (!row) return null;

  const ctrl = useAuctionDrawerController(
    row,
    (updated) => {
      handleUpdate(updated);
      revalidate();
    },
    undefined,
    () => navigate(`/auctions/${auctionId}`),
  );

  return (
    <>
      <AuctionEditPanel
        startingBid={ctrl.startingBid}
        setStartingBid={ctrl.setStartingBid}
        increment={ctrl.increment}
        setIncrement={ctrl.setIncrement}
        startDate={ctrl.startDate}
        setStartDate={ctrl.setStartDate}
        endDate={ctrl.endDate}
        setEndDate={ctrl.setEndDate}
      />

      <ListingSection
        row={ctrl.row}
        listingLoading={ctrl.listingLoading}
        loading={ctrl.loading}
        saveSucceeded={ctrl.saveSucceeded}
        moderationStatus={ctrl.moderationStatus}
        setModerationStatus={ctrl.setModerationStatus}
        onSave={ctrl.handleSaveAll}
        onCancel={ctrl.handleCancelEdit}
        title={ctrl.title}
        setTitle={ctrl.setTitle}
        type={ctrl.type}
        setType={ctrl.setType}
        primaryImage={ctrl.primaryImage}
        setPrimaryImage={ctrl.setPrimaryImage}
        address={ctrl.address}
        setAddress={ctrl.setAddress}
        city={ctrl.city}
        setCity={ctrl.setCity}
        state={ctrl.state}
        setState={ctrl.setState}
        zipcode={ctrl.zipcode}
        setZipcode={ctrl.setZipcode}
      />
    </>
  );
}
