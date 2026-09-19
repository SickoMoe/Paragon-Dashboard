import { useState } from "react";
import { Outlet, useLoaderData, useNavigate } from "react-router-dom";
import { AuctionsToolbar } from "../../features/auctions/components/AuctionsToolbar";
import { AuctionsTable } from "../../features/auctions/components/AuctionTable";
import {
  AuctionPageProvider,
  useDashboardPageContext,
} from "./auctionPageContext";
import { DashboardFrame } from "../../core/layout/DashboardFrame";
import type { AuctionOverview } from "../../features/auctions/types";
import { AuctionsInsights } from "../../features/AuctionsInsights";
import {
  AuctionCounts,
  AuctionsTabs,
} from "../../features/auctions/components/AuctionsTabs";
import { CreateAuctionModal } from "../../features/auctionCreate/CreateAuctionDrawer";
import { createAuction } from "../../features/auctions/services/auctionDashboardApi";
import {
  createListing as createPropertyListing,
  placeMissingListingsNear,
} from "../../features/listingApi";

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
  const [creating, setCreating] = useState(false);
  const [placingCoordinates, setPlacingCoordinates] = useState(false);
  const [coordinateMessage, setCoordinateMessage] = useState<string | null>(
    null,
  );
  const navigate = useNavigate();
  const {
    auctions,
    filteredAuctions,
    tab,
    setTab,
    search,
    setSearch,
    handleCreated,
  } = useDashboardPageContext();

  const counts: AuctionCounts = auctions.reduce(
    (acc, row) => {
      acc[row.auction.status] = (acc[row.auction.status] ?? 0) + 1;
      return acc;
    },
    { all: auctions.length } as AuctionCounts,
  );

  const handlePlaceNearMe = () => {
    if (!navigator.geolocation) {
      setCoordinateMessage("Location is not supported by this browser.");
      return;
    }

    setPlacingCoordinates(true);
    setCoordinateMessage("Finding your location...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        void placeMissingListingsNear({
          latitude: coords.latitude,
          longitude: coords.longitude,
          radiusKm: 8,
        })
          .then(({ updatedCount }) => {
            setCoordinateMessage(
              updatedCount
                ? `${updatedCount} listings placed near you.`
                : "Every listing already has coordinates.",
            );
          })
          .catch((error) => {
            setCoordinateMessage(
              error instanceof Error
                ? error.message
                : "Unable to place listings.",
            );
          })
          .finally(() => setPlacingCoordinates(false));
      },
      (error) => {
        setCoordinateMessage(
          error.code === error.PERMISSION_DENIED
            ? "Location access was not allowed."
            : "Your location could not be determined.",
        );
        setPlacingCoordinates(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

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
              className="dashActionSecondary"
              onClick={handlePlaceNearMe}
              disabled={placingCoordinates}
              title="Use your current location to place listings without coordinates"
            >
              {placingCoordinates ? "Locating..." : "Place entries near me"}
            </button>
            <button type="button" onClick={() => setCreating(true)}>
              + New
            </button>
            {coordinateMessage ? (
              <span className="dashActionMessage" role="status">
                {coordinateMessage}
              </span>
            ) : null}
          </div>
        }
      />

      <AuctionsTable
        rows={filteredAuctions}
        onRowClick={(row) => {
          if (row.auctionDraft) {
            navigate(`/auctions/${row.auction.id}/edit`);
            return;
          }
          navigate(`/auctions/${row.auction.id}`);
        }}
      />

      <Outlet />

      {creating && (
        <CreateAuctionModal
          onClose={() => setCreating(false)}
          onSubmit={async (input) => {
            const listing = input.listing
              ? await createPropertyListing(input.listing)
              : null;
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
