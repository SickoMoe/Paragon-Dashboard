// src/routes/dashboard/controllers/useDashboardController.ts
import { useMemo, useState } from "react";
import type { IAuction } from "../../interfaces/IAuction";
import { AuctionOverview } from "../../features/auctions/types";

export type AuctionTab = "all" | IAuction["status"];

export function useDashboardController(initialAuctions: AuctionOverview[]) {
  // source of truth for table
  const [auctions, setAuctions] = useState<AuctionOverview[]>(initialAuctions);

  // drawer selection
  const [selectedAuction, setSelectedAuction] = useState<AuctionOverview | null>(null);


const addOptimistic = (row: AuctionOverview) => {
  setAuctions((prev) => [row, ...prev]);
  setSelectedAuction(row);
};

const replaceAuction = (tempId: string, real: AuctionOverview) => {
  setAuctions((prev) =>
    prev.map((a) => (a.auction.id === tempId ? real : a))
  );
  setSelectedAuction(real);
};

const removeAuction = (tempId: string) => {
  setAuctions((prev) =>
    prev.filter((a) => a.auction.id !== tempId)
  );
};
  // NEW: table controls
  const [tab, setTab] = useState<AuctionTab>("all");
  const [search, setSearch] = useState("");

  const filteredAuctions = useMemo(() => {
    const q = search.trim().toLowerCase();

    return auctions.filter((a) => {
      // tab filter
      const tabOk = tab === "all" ? true : a.auction.status === tab;

      // search filter (safe even if listing is missing)
      const title = a.listing?.basicInformation?.title ?? "";
      const location =
        a.listing?.basicInformation?.location?.city ??
        a.listing?.basicInformation?.location?.state ??
        "";

      const searchOk =
        !q ||
        a.auction.id.toLowerCase().includes(q) ||
        a.auction.listingId.toLowerCase().includes(q) ||
        title.toLowerCase().includes(q) ||
        String(location).toLowerCase().includes(q);

      return tabOk && searchOk;
    });
  }, [auctions, tab, search]);

  const handleRowClick = (auction: AuctionOverview) => {
    setSelectedAuction(auction);
  };

  const handleUpdate = (updated: AuctionOverview) => {
    setAuctions((prev) => prev.map((a) => (a.auction.id === updated.auction.id ? updated : a)));
    setSelectedAuction((prev) => (prev?.auction.id === updated.auction.id ? updated : prev));
  };

  const handleDelete = (id: string) => {
    setAuctions((prev) => prev.filter((a) => a.auction.id !== id));
    setSelectedAuction((prev) => (prev?.auction.id === id ? null : prev));
  };

  const closeDrawer = () => setSelectedAuction(null);
const handleCreated = (row: AuctionOverview) => {
  setAuctions((prev) => [row, ...prev]);
  setSelectedAuction(row); // optional: open it immediately
};
  return {
    // data
    auctions,
    filteredAuctions,
    selectedAuction,

    // table controls
    tab,
    setTab,
    search,
    setSearch,

    addOptimistic,replaceAuction,removeAuction,
    // actions
    handleRowClick,
    handleUpdate,
    handleDelete,
    closeDrawer,
    handleCreated,
  };
}