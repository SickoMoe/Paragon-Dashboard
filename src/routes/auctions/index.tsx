import { useState } from "react";
import { Outlet, useLoaderData, useNavigate, useSearchParams } from "react-router-dom";
import { AuctionsToolbar } from "../../features/auctions/components/AuctionsToolbar";
import { AuctionsTable } from "../../features/auctions/components/AuctionTable";
import { AuctionPageProvider, useDashboardPageContext } from "./auctionPageContext";
import { DashboardFrame } from "../../core/layout/DashboardFrame";
import type { AuctionOverview } from "../../features/auctions/types";
import { AuctionsInsights } from "../../features/AuctionsInsights";
import { AuctionCounts, AuctionsTabs } from "../../features/auctions/components/AuctionsTabs";
import { CreateAuctionModal } from "../../features/auctionCreate/CreateAuctionDrawer";
import { createAuction } from "../../features/auctions/services/auctionDashboardApi";
import { createListing as createPropertyListing } from "../../features/listingApi";

const toISO = (v?: string) => (v ? new Date(v).toISOString() : undefined);

export default function AuctionsPage() {
  const auctions = useLoaderData() as AuctionOverview[];

  return (
    <AuctionPageProvider initialAuctions={auctions}>
      <AuctionsPageContent />
    </AuctionPageProvider>
  );
}

function AuctionsPageContent() {
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const requestedListingId = params.get("create") === "1" ? params.get("listing") || undefined : undefined;
  const closeCreation = () => {
    setCreating(false);
    setParams(current => { const next = new URLSearchParams(current); next.delete("create"); next.delete("listing"); return next; }, { replace: true });
  };
  const [creationMode, setCreationMode] = useState<"existing" | "new">("existing");
  const navigate = useNavigate();
  const { auctions, filteredAuctions, tab, setTab, search, setSearch, handleCreated } =
    useDashboardPageContext();

  const counts: AuctionCounts = auctions.reduce(
    (acc, row) => {
      acc[row.auction.status] = (acc[row.auction.status] ?? 0) + 1;
      return acc;
    },
    { all: auctions.length } as AuctionCounts,
  );

  return (
    <>
      <DashboardFrame
        title="Auctions"
        subtitle={<AuctionsInsights auctions={filteredAuctions} />}
        tabs={<AuctionsTabs value={tab} onChange={setTab} counts={counts} />}
        toolbar={<AuctionsToolbar search={search} onSearch={setSearch} />}
        action={
          <div className="dashActionGroup">
            <button
              type="button"
              onClick={() => {
                setCreationMode("new");
                setCreating(true);
              }}
            >
              Create property
            </button>
            <button
              type="button"
              className="dashActionSecondary"
              onClick={() => {
                setCreationMode("existing");
                setCreating(true);
              }}
            >
              Create auction manually
            </button>
          </div>
        }
      />

      <AuctionsTable
        rows={filteredAuctions}
        onRowClick={(row) => {
          if (
            row.auctionDraft ||
            ["draft", "pending_approval", "changes_requested", "scheduled"].includes(
              row.auction.status,
            )
          ) {
            navigate(`/auctions/${row.auction.id}/edit`);
            return;
          }
          navigate(`/auctions/${row.auction.id}`);
        }}
      />

      <Outlet />

      {(creating || requestedListingId) && (
        <CreateAuctionModal
          initialMode={requestedListingId ? "existing" : creationMode}
          initialListingId={requestedListingId}
          onClose={closeCreation}
          onSubmit={async (input) => {
            const listing = input.listing ? await createPropertyListing(input.listing) : null;
            const listingId = listing?.listingId ?? input.listingId;
            if (!listingId) throw new Error("A listing is required.");

            const created = await createAuction({
              listingId,
              startingBid: input.startingBid,
              rules: { bidIncrement: input.bidIncrement },
              startDate: toISO(input.startDate),
              endDate: toISO(input.endDate),
              status: input.status,
              isPrivate: input.isPrivate,
              authorizedAccountIds: input.isPrivate ? input.authorizedAccountIds : [],
            });

            handleCreated({
              ...created,
              listing: listing ?? created.listing,
            });
          }}
        />
      )}
    </>
  );
}
