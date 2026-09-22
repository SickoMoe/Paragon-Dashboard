// src/routes/dashboard/services/auctionDashboardApi.ts
import { AuctionOverview } from "../types";
import type { IAuction, AuctionRules } from "../../../interfaces/IAuction";
import { request } from "../../../core/api/request";
import { BASE_URL } from "../../../core/const";

export type AuctionPatch = Partial<{
  id: string;
  listingId: string;
  startingBid: number;
  isPrivate: boolean;
  authorizedAccountIds: string[];
  rules: Partial<AuctionRules>;
  startDate: string;
  endDate: string;
}>;

export type AuctionDraftPayload = {
  listingId: string;
  approvedReviewRequestId?: string;
  approvedSnapshotHash?: string;
  approvedDraftRevision?: number;
  approvedListingRevision?: number;
  startingBid?: number;
  rules?: Partial<AuctionRules>;
  startDate?: string;
  endDate?: string;
  isPrivate?: boolean;
  authorizedAccountIds?: string[];
  status?: "draft" | "scheduled";
  approvalReason?: string;
};

export type AuctionDraftRecord = {
  id: string;
  ownerAccountId: string;
  status: string;
  auctionId?: string;
  payload: AuctionDraftPayload;
  createdAt: string;
  updatedAt: string;
};

export type AuctionDraftReadiness = {
  checks?: import("../../auctionPreparation/preparation").Check[];
  ready: boolean;
  missingFields: string[];
  validationErrors: Array<{ field: string; message: string }>;
};

export type AuctionCreateInput = {
  listingId: string;
  startingBid?: number;
  rules?: Partial<AuctionRules>;
  startDate?: string;
  endDate?: string;
  status?: IAuction["status"];
  isPrivate?: boolean;
  authorizedAccountIds?: string[];
};

export function patchAuction(id: string, patch: AuctionPatch): Promise<IAuction> {
  return request(`${BASE_URL}/auctions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function patchAuctionDraft(id: string, payload: AuctionDraftPayload): Promise<AuctionDraftRecord> {
  return request(`${BASE_URL}/drafts/auctions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function fetchAuctionDraftReadiness(id: string): Promise<AuctionDraftReadiness> {
  return request(`${BASE_URL}/drafts/auctions/${id}/readiness`);
}

export function createAuction(input: AuctionCreateInput): Promise<AuctionOverview> {
  return request(`${BASE_URL}/auctions`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAuctionSchedule(id: string, startDate: string, endDate: string): Promise<IAuction> {
  return request(`${BASE_URL}/auctions/${id}/schedule`, {
    method: "PATCH",
    body: JSON.stringify({ startDate, endDate }),
  });
}

export function submitAuction(id: string): Promise<IAuction> {
  return request(`${BASE_URL}/auctions/${id}/submit`, { method: "PATCH" });
}

export function withdrawAuction(id: string): Promise<IAuction> {
  return request(`${BASE_URL}/auctions/${id}/withdraw`, { method: "PATCH" });
}

export function approveAuction(id: string): Promise<IAuction> {
  return request(`${BASE_URL}/auctions/${id}/approve`, { method: "PATCH" });
}

export function requestAuctionChanges(id: string, reason: string): Promise<IAuction> {
  return request(`${BASE_URL}/auctions/${id}/request-changes`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export function rejectAuction(id: string, reason: string): Promise<IAuction> {
  return request(`${BASE_URL}/auctions/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export function publishAuction(id: string): Promise<IAuction> {
  return request(`${BASE_URL}/auctions/${id}/publish`, { method: "PATCH" });
}

export function pauseAuction(id: string, reason: string): Promise<IAuction> {
  return request(`${BASE_URL}/auctions/${id}/pause`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export function resumeAuction(id: string): Promise<IAuction> {
  return request(`${BASE_URL}/auctions/${id}/resume`, { method: "PATCH" });
}

export function endAuction(id: string): Promise<IAuction> {
  return request(`${BASE_URL}/auctions/${id}/end`, { method: "PATCH" });
}

export function cancelAuction(id: string, reason: string): Promise<IAuction> {
  return request(`${BASE_URL}/auctions/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export function archiveAuction(id: string): Promise<IAuction> {
  return request(`${BASE_URL}/auctions/${id}/archive`, { method: "PATCH" });
}

export function relistAuction(id: string): Promise<AuctionOverview> {
  return request(`${BASE_URL}/auctions/${id}/relist`, { method: "POST" });
}

export type DeleteAuctionResult = { mode: "deleted" | "archived"; auction?: IAuction };

export function deleteAuction(id: string): Promise<DeleteAuctionResult | void> {
  return request(`${BASE_URL}/auctions/${id}`, { method: "DELETE" });
}
