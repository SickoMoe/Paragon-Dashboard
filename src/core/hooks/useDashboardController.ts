// src/routes/dashboard/controllers/useDashboardController.ts
import { useCallback, useMemo, useState } from "react";
import type { IAuction } from "../../interfaces/IAuction";
import type { AuctionOverview } from "../../features/auctions/types";
import type { AuctionRealtimeEvent } from "../../features/auctions/services/auctionRealtime";

export type AuctionTab = "all" | IAuction["status"];

export function useDashboardController(initialAuctions: AuctionOverview[]) {
  const [auctions, setAuctions] = useState<AuctionOverview[]>(initialAuctions);
  const [selectedAuction, setSelectedAuction] = useState<AuctionOverview | null>(null);

  const replaceAuctions = useCallback((nextAuctions: AuctionOverview[]) => {
    setAuctions(nextAuctions);
    setSelectedAuction((prev) => {
      if (!prev) return null;
      return nextAuctions.find((a) => a.auction.id === prev.auction.id) ?? null;
    });
  }, []);

  const upsertAuction = useCallback((row: AuctionOverview) => {
    setAuctions((prev) => {
      const exists = prev.some((a) => a.auction.id === row.auction.id);
      return exists
        ? prev.map((a) => (a.auction.id === row.auction.id ? row : a))
        : [row, ...prev];
    });
    setSelectedAuction((prev) => (prev?.auction.id === row.auction.id ? row : prev));
  }, []);

  const addOptimistic = useCallback((row: AuctionOverview) => {
    setAuctions((prev) => [row, ...prev]);
    setSelectedAuction(row);
  }, []);

  const replaceAuction = useCallback((tempId: string, real: AuctionOverview) => {
    setAuctions((prev) => prev.map((a) => (a.auction.id === tempId ? real : a)));
    setSelectedAuction(real);
  }, []);

  const removeAuction = useCallback((tempId: string) => {
    setAuctions((prev) => prev.filter((a) => a.auction.id !== tempId));
    setSelectedAuction((prev) => (prev?.auction.id === tempId ? null : prev));
  }, []);

  const [tab, setTab] = useState<AuctionTab>("all");
  const [search, setSearch] = useState("");

  const filteredAuctions = useMemo(() => {
    const q = search.trim().toLowerCase();

    return auctions.filter((a) => {
      const tabOk = tab === "all" ? true : a.auction.status === tab;
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

  const handleRowClick = useCallback((auction: AuctionOverview) => {
    setSelectedAuction(auction);
  }, []);

  const handleUpdate = useCallback(
    (updated: AuctionOverview) => {
      upsertAuction(updated);
    },
    [upsertAuction],
  );

  const handleDelete = useCallback((id: string) => {
    setAuctions((prev) => prev.filter((a) => a.auction.id !== id));
    setSelectedAuction((prev) => (prev?.auction.id === id ? null : prev));
  }, []);

  const closeDrawer = useCallback(() => setSelectedAuction(null), []);

  const handleCreated = useCallback(
    (row: AuctionOverview) => {
      upsertAuction(row);
      setSelectedAuction(row);
    },
    [upsertAuction],
  );

  const updateBidSnapshot = useCallback(
    (auctionId: string, bid: AuctionOverview["bid"]) => {
      setAuctions((prev) =>
        prev.map((row) =>
          row.auction.id === auctionId
            ? {
                ...row,
                bid,
              }
            : row,
        ),
      );
      setSelectedAuction((prev) =>
        prev?.auction.id === auctionId
          ? {
              ...prev,
              bid,
            }
          : prev,
      );
    },
    [],
  );

  const handleRealtimeEvent = useCallback(
    (event: AuctionRealtimeEvent) => {
      if (event.type === "auction.deleted") {
        if (event.auctionId) handleDelete(event.auctionId);
        return;
      }

      if (event.payload?.view) {
        upsertAuction(event.payload.view);
      }

      if (event.auctionId && event.payload?.bidSnapshot) {
        updateBidSnapshot(event.auctionId, event.payload.bidSnapshot);
      }
    },
    [handleDelete, updateBidSnapshot, upsertAuction],
  );

  return {
    auctions,
    filteredAuctions,
    selectedAuction,
    tab,
    setTab,
    search,
    setSearch,
    addOptimistic,
    replaceAuction,
    removeAuction,
    replaceAuctions,
    upsertAuction,
    updateBidSnapshot,
    handleRowClick,
    handleUpdate,
    handleDelete,
    closeDrawer,
    handleCreated,
    handleRealtimeEvent,
  };
}
