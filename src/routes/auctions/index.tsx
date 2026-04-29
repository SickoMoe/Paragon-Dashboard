import { useState } from "react";
import { Outlet, useLoaderData, useNavigate, useParams } from "react-router-dom";
import { AuctionsToolbar } from "../../features/auctions/components/AuctionsToolbar";
import { AuctionsTable } from "../../features/auctions/components/AuctionTable";
import { useDashboardController } from "../../core/hooks/useDashboardController";
import { AuctionPageProvider } from "./auctionPageContext";
import { DashboardFrame } from "../../core/layout/DashboardFrame";
import { AuctionOverview } from "../../features/auctions/types";
import { AuctionsInsights } from "../../features/AuctionsInsights";
import { AuctionCounts, AuctionsTabs } from "../../features/auctions/components/AuctionsTabs";
import { CreateAuctionModal, createOptimisticDraft,  } from "../../features/auctionCreate/CreateAuctionDrawer";
import { createAuction } from "../../features/auctions/services/auctionDashboardApi";

const toISO = (v?: string) =>
  v ? new Date(v).toISOString() : undefined;

export default function AuctionsPage() {
  const [creating, setCreating] = useState(false);
  const auctions = useLoaderData() as AuctionOverview[];
  const navigate = useNavigate();

  const counts: AuctionCounts = {
    all: auctions.length,
    draft: auctions.filter(a => a.auction.status === "draft").length,
    scheduled: auctions.filter(a => a.auction.status === "scheduled").length,
    live: auctions.filter(a => a.auction.status === "live").length,
    ended: auctions.filter(a => a.auction.status === "ended").length,
    cancelled: auctions.filter(a => a.auction.status === "cancelled").length,
  };

  const {
    filteredAuctions,
    tab,
    setTab,
    search,
    setSearch,
    handleCreated,
  } = useDashboardController(auctions);

  async function handleCreateAuction(input: {
    listingId: string;
    startingBid?: number;
    rules?: { bidIncrement?: number };
    startDate?: string;
    endDate?: string;
  }) {
    const created = await createAuction({
      listingId: input.listingId,
      startingBid: input.startingBid,
      rules: {
        bidIncrement: input.rules?.bidIncrement ?? 1000,
      },
      startDate: toISO(input.startDate),
      endDate: toISO(input.endDate),
    });

    handleCreated(created);
    setCreating(false);
  }
      const toISO = (v?: string) =>
  v ? new Date(v).toISOString() : undefined;

  return (
    <AuctionPageProvider initialAuctions={auctions}>
      <DashboardFrame
        title="Auctions"
        subtitle={<AuctionsInsights auctions={filteredAuctions} />}
        tabs={<AuctionsTabs value={tab} onChange={setTab} counts={counts} />}
        toolbar={<AuctionsToolbar search={search} onSearch={setSearch} />}
        action={<button onClick={() => setCreating(true)}>+ New</button>}
      />

      <AuctionsTable
        rows={filteredAuctions}
        onRowClick={(row) => navigate(`/auctions/${row.auction.id}`)}
      />

      <Outlet />

      {creating && (

<CreateAuctionModal
  onClose={() => setCreating(false)}
  onSubmit={async (input) => {
    const created = await createAuction({
      listingId: input.listingId,
      startingBid: input.startingBid,
      rules: { bidIncrement: input.bidIncrement },
      startDate: toISO(input.startDate),
      endDate: toISO(input.endDate),
      status: input.status,
    });

    handleCreated(created);
  }}
/>
      )}
    </AuctionPageProvider>
  );
}