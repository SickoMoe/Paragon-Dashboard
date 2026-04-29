// src/routes/dashboard/DashboardPageContext.tsx
import React, { createContext, useContext } from "react";
import { useDashboardController } from "../../core/hooks/useDashboardController";
import { AuctionOverview } from "../../features/auctions/types";

interface DashboardPageContextValue {
  auctions: AuctionOverview[];
  selectedAuction: AuctionOverview | null;
  handleRowClick: (auction: AuctionOverview) => void;
  handleUpdate: (updated: AuctionOverview) => void;
  handleDelete: (id: string) => void;
  closeDrawer: () => void;
}

const DashboardPageContext = createContext<DashboardPageContextValue | null>(
  null
);

export const useDashboardPageContext = () => {
  const ctx = useContext(DashboardPageContext);
  if (!ctx) {
    throw new Error(
      "useDashboardPageContext must be used within AuctionPageProvider"
    );
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
    selectedAuction,
    handleRowClick,
    handleUpdate,
    handleDelete,
    closeDrawer,
  } = useDashboardController(initialAuctions);

  const value: DashboardPageContextValue = {
    auctions,
    selectedAuction,
    handleRowClick,
    handleUpdate,
    handleDelete,
    closeDrawer,
  };

  return (
    <DashboardPageContext.Provider value={value}>
      {children}
    </DashboardPageContext.Provider>
  );
};