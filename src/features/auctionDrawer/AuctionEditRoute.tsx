// routes/auctions/AuctionEditRoute.tsx
import { useCallback } from "react";
import { useNavigate, useParams, useRevalidator } from "react-router-dom";
import { useAuctionDrawerController } from "../auctions/hooks/useAuctionDrawerController";
import { AuctionEditPanel } from "./AuctionEditPanel";
import { ListingSection } from "./sections/ListingSection";
import { useDashboardPageContext } from "../../routes/auctions/auctionPageContext";
import type { AuctionOverview } from "../auctions/types";
import { useAuctionDrawerCloseGuard } from "./AuctionDrawerRoute";
import { ListingEditorSection } from "../listingEditor/ListingEditorSection";

export default function AuctionEditRoute() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const { auctions, handleUpdate } = useDashboardPageContext();

  const row = auctions.find((a) => a.auction.id === auctionId);
  if (!row) return null;

  return <AuctionEditRouteContent row={row} auctionId={auctionId} onUpdate={handleUpdate} />;
}

function AuctionEditRouteContent({
  row,
  auctionId,
  onUpdate,
}: {
  row: AuctionOverview;
  auctionId?: string;
  onUpdate: (updated: AuctionOverview) => void;
}) {
  const navigate = useNavigate();
  const { revalidate } = useRevalidator();
  const ctrl = useAuctionDrawerController(
    row,
    (updated) => {
      onUpdate(updated);
      revalidate();
    },
    undefined,
    () => navigate(`/auctions/${auctionId}`),
  );

  const closeGuard = useCallback(() => {
    if (!ctrl.hasUnsavedChanges) return true;
    return window.confirm("Discard unsaved auction configuration changes?");
  }, [ctrl.hasUnsavedChanges]);

  useAuctionDrawerCloseGuard(closeGuard);

  return (
    <>
      <AuctionEditPanel
        row={ctrl.row}
        startingBid={ctrl.startingBid}
        setStartingBid={ctrl.setStartingBid}
        increment={ctrl.increment}
        setIncrement={ctrl.setIncrement}
        startDate={ctrl.startDate}
        setStartDate={ctrl.setStartDate}
        endDate={ctrl.endDate}
        setEndDate={ctrl.setEndDate}
        isPrivate={ctrl.isPrivate}
        setIsPrivate={ctrl.setIsPrivate}
        authorizedAccountIds={ctrl.authorizedAccountIds}
        setAuthorizedAccountIds={ctrl.setAuthorizedAccountIds}
        readiness={ctrl.readiness}
        readinessLoading={ctrl.readinessLoading}
        readinessError={ctrl.readinessError}
        loading={ctrl.loading}
        saveSucceeded={ctrl.saveSucceeded}
        error={ctrl.auctionError}
        hasUnsavedChanges={ctrl.hasUnsavedChanges}
        onSave={ctrl.handleSaveAll}
        onCancel={ctrl.handleCancelEdit}
        onOpenConversation={() => navigate(`/messages?listingId=${ctrl.row.auction.listingId}`)}
        onOpenBids={() => navigate(`/auctions/${ctrl.row.auction.id}/leaderboard`)}
      />

      {ctrl.row.listing ? (
        <ListingEditorSection
          listing={ctrl.row.listing}
          onUpdated={ctrl.handleExternalListingUpdate}
        />
      ) : null}

      <ListingSection
        row={ctrl.row}
        listingLoading={ctrl.listingLoading}
        onOpenConversation={() => navigate(`/messages?listingId=${ctrl.row.auction.listingId}`)}
      />
    </>
  );
}
