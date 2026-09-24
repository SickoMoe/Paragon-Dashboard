// routes/auctions/AuctionOverviewRoute.tsx
import { Link, Navigate, useNavigate, useParams, useRevalidator } from "react-router-dom";
import { useDashboardPageContext } from "../../routes/auctions/auctionPageContext";
import { AuctionOverviewPanel } from "./AuctionOverviewPanel";
import { useAuctionDrawerController } from "../auctions/hooks/useAuctionDrawerController";
import type { AuctionOverview } from "../auctions/types";

export default function AuctionOverviewRoute() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const { auctions, handleUpdate, handleDelete } = useDashboardPageContext();

  if (!auctionId) return null;

  const row = auctions.find((a) => a.auction.id === auctionId);
  if (!row) return null;
  if (row.auctionDraft || ["draft", "pending_approval", "changes_requested", "scheduled"].includes(row.auction.status)) return <Navigate to={`/auctions/${auctionId}/edit`} replace />;

  return (
    <AuctionOverviewRouteContent
      row={row}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}

function AuctionOverviewRouteContent({
  row,
  onUpdate,
  onDelete,
}: {
  row: AuctionOverview;
  onUpdate: (updated: AuctionOverview) => void;
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();
  const { revalidate } = useRevalidator();
  const ctrl = useAuctionDrawerController(
    row,
    (updated) => {
      onUpdate(updated);
      revalidate();
    },
    onDelete,
    () => navigate("/auctions"),
  );

  return (
    <>
    {["ended", "archived"].includes(row.auction.status) ? <p style={{ padding: "0 20px" }}><Link to={`/transactions?auction=${encodeURIComponent(row.auction.id)}`}>View transaction and closing →</Link></p> : null}
    <AuctionOverviewPanel
      row={row}
      loading={ctrl.loading}
      error={ctrl.auctionError}
      onViewBids={() => navigate("leaderboard")}
      onEdit={() => navigate("edit")}
      onSubmit={ctrl.handleSubmit}
      onWithdraw={ctrl.handleWithdraw}
      onApprove={ctrl.handleApprove}
      onRequestChanges={ctrl.handleRequestChanges}
      onReject={ctrl.handleReject}
      onPublish={ctrl.handlePublish}
      onPause={ctrl.handlePause}
      onResume={ctrl.handleResume}
      onEnd={ctrl.handleEnd}
      onCancelAuction={ctrl.handleCancelAuction}
      onArchive={ctrl.handleArchive}
      onRelist={ctrl.handleRelist}
      onDelete={ctrl.handleDeleteClick}
    />
    </>
  );
}
