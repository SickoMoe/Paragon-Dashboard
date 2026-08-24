// src/routes/dashboard/DashboardPageContext.tsx
import React, { createContext, useContext, useEffect } from "react";
import {
  useDashboardController,
  type AuctionTab,
} from "../../core/hooks/useDashboardController";
import type { AuctionOverview } from "../../features/auctions/types";
import { useAuctionRealtime } from "../../features/auctions/hooks/useAuctionRealtime";

interface DashboardPageContextValue {
  auctions: AuctionOverview[];
  filteredAuctions: AuctionOverview[];
  selectedAuction: AuctionOverview | null;
  tab: AuctionTab;
  setTab: React.Dispatch<React.SetStateAction<AuctionTab>>;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  handleRowClick: (auction: AuctionOverview) => void;
  handleUpdate: (updated: AuctionOverview) => void;
  handleDelete: (id: string) => void;
  handleCreated: (row: AuctionOverview) => void;
  closeDrawer: () => void;
}

const DashboardPageContext = createContext<DashboardPageContextValue | null>(null);

export const useDashboardPageContext = () => {
  const ctx = useContext(DashboardPageContext);
  if (!ctx) {
    throw new Error("useDashboardPageContext must be used within AuctionPageProvider");
  }
  return ctx;
};

interface AuctionPageProviderProps {
  initialAuctions: AuctionOverview[];
  children: React.ReactNode;
}

export const AuctionPageProvider: React.FC<AuctionPageProviderProps> = ({
  initialAuctions,
  children,
}) => {
  const {
    auctions,
    filteredAuctions,
    selectedAuction,
    tab,
    setTab,
    search,
    setSearch,
    replaceAuctions,
    handleRowClick,
    handleUpdate,
    handleDelete,
    handleCreated,
    closeDrawer,
    handleRealtimeEvent,
  } = useDashboardController(initialAuctions);

  useEffect(() => {
    replaceAuctions(initialAuctions);
  }, [initialAuctions, replaceAuctions]);

  useAuctionRealtime(handleRealtimeEvent);

  const value: DashboardPageContextValue = {
    auctions,
    filteredAuctions,
    selectedAuction,
    tab,
    setTab,
    search,
    setSearch,
    handleRowClick,
    handleUpdate,
    handleDelete,
    handleCreated,
    closeDrawer,
  };

  return <DashboardPageContext.Provider value={value}>{children}</DashboardPageContext.Provider>;
};
