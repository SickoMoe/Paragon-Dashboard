// src/routes/dashboard/components/auctionDrawer/AuctionDrawer.types.ts

import { IAuction } from "../../interfaces/IAuction";
import { AuctionLeaderboardDTO } from "../auctions/services/auctionBidApi";
import { AuctionOverview } from "../auctions/types";

export interface AuctionDrawerUIProps {
  row: AuctionOverview;
  onClose: () => void;

  // schedule
  editingSchedule: boolean;
  setEditingSchedule: (value: boolean) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  startLabel: string;
  endLabel: string;
  handleScheduleSave: () => void;

  // listing edits
  listingLoading: boolean;
  title: string;
  setTitle: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  state: string;
  setState: (v: string) => void;
  zipcode: string;
  setZipcode: (v: string) => void;
  primaryImage: string;
  setPrimaryImage: (v: string) => void;
  handleSaveListing: () => void;

  // details edits
  editingDetails: boolean;
  setEditingDetails: (value: boolean) => void;

  listingId: string;
  setListingId: (v: string) => void;

  startingBid: string;
  setStartingBid: (v: string) => void;

  increment: string;
  setIncrement: (v: string) => void;

  status: IAuction["status"];
  setStatus: (v: IAuction["status"]) => void;

  // shared
  loading: boolean;

  // actions
  handleSaveDetails: () => void;
  handlePublish: () => void;
  handleEnd: () => void;
  handleDeleteClick: () => void;

  // bids panel
  bidsOpen: boolean;
  bidsLoading: boolean;
  bidsError: string | null;
  leaderboard: AuctionLeaderboardDTO | null;
  handleOpenBids: () => void;
  handleCloseBids: () => void;
}