// src/interfaces/IAuction.ts
import type { IListing } from "./IListing";

export interface AuctionRules {
  bidIncrement: number;
  currency: string;
  buyNowPrice?: number;
  reservePrice?: number;
}

export type AuctionStatus = "draft" | "scheduled" | "live" | "ended" | "cancelled";

export interface IAuctionRoleType {
  name: "owner" | "bidder" | "broker" | "viewer";
  label: string;
  permissions: string[];
  profileIds: string[];
  isParticipant?: boolean;
}

export interface IAuction {
  id: string;
  listingId: string;

  // optional if your server includes it sometimes
  listing?: IListing;

  startingBid?: number;          // ✅ add this
  rules: AuctionRules;           // ✅ object, not array

  roles: IAuctionRoleType[];
  bids: any[];

  startDate?: string;
  endDate?: string;

  isPrivate: boolean;
  status: AuctionStatus;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
