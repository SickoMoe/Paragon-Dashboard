// src/interfaces/IAuction.ts
import type { IListing } from "./IListing";

export interface AuctionRules {
  bidIncrement: number;
  currency: string;
  buyNowPrice?: number;
  reservePrice?: number;
}

export type AuctionStatus =
  | "draft"
  | "pending_approval"
  | "changes_requested"
  | "scheduled"
  | "live"
  | "paused"
  | "ended"
  | "cancelled"
  | "rejected"
  | "archived";

export type AuctionLifecycleAction =
  | "create"
  | "update"
  | "submit"
  | "withdraw"
  | "approve"
  | "request_changes"
  | "reject"
  | "schedule"
  | "publish"
  | "pause"
  | "resume"
  | "end"
  | "cancel"
  | "archive"
  | "delete"
  | "relist";

export interface AuctionLifecycleEvent {
  action: AuctionLifecycleAction;
  actorAccountId?: string;
  fromStatus?: AuctionStatus;
  toStatus?: AuctionStatus;
  reason?: string;
  at: string;
  meta?: Record<string, unknown>;
}

export interface AuctionLifecycleState {
  approvedBy?: string;
  approvedAt?: string;
  changeReason?: string;
  rejectedReason?: string;
  pausedBy?: string;
  pausedAt?: string;
  pauseReason?: string;
  remainingDurationMs?: number;
  cancelledReason?: string;
  archivedBy?: string;
  archivedAt?: string;
  relistedFromAuctionId?: string;
  auditTrail?: AuctionLifecycleEvent[];
}

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

  listing?: IListing;

  startingBid?: number;
  rules: AuctionRules;

  roles: IAuctionRoleType[];
  bids: any[];

  startDate?: string;
  endDate?: string;

  isPrivate: boolean;
  authorizedAccountIds?: string[];
  status: AuctionStatus;
  lifecycle?: AuctionLifecycleState;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
