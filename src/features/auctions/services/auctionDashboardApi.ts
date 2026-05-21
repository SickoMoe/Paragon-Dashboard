// src/routes/dashboard/services/auctionDashboardApi.ts
import { AuctionOverview } from "../types";
import type { IAuction, AuctionRules } from "../../../interfaces/IAuction";
import { request } from "../../../core/api/request";
import { BASE_URL } from "../../../core/const";

export type AuctionPatch = Partial<{
  id: string;
  startingBid: number;
  isPrivate: boolean;
  status: IAuction["status"];
  rules: Partial<AuctionRules>;
}>;
export type AuctionCreateInput = {
  listingId: string;
  startingBid?: number;
  rules?: Partial<AuctionRules>; // e.g. { bidIncrement: 1000 }
  startDate?: string; // ISO
  endDate?: string; // ISO
  status?: IAuction["status"]; // usually "draft" or "scheduled"
};

export function patchAuction(id: string, patch: AuctionPatch): Promise<IAuction> {
  return request(`${BASE_URL}/auctions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
export async function createAuction(input: AuctionCreateInput): Promise<AuctionOverview> {
  const data = await request<AuctionOverview | AuctionOverview[]>(`${BASE_URL}/drafts/auctions`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return Array.isArray(data) ? data[0] : data;
}
export function updateAuctionSchedule(id: string, startDate: string, endDate: string): Promise<IAuction> {
  return request(`${BASE_URL}/auctions/${id}/schedule`, {
    method: "PATCH",
    body: JSON.stringify({ startDate, endDate }),
  });
}

export function publishAuction(id: string): Promise<IAuction> {
  return request(`${BASE_URL}/auctions/${id}/publish`, { method: "PATCH" });
}

export function endAuction(id: string): Promise<IAuction> {
  return request(`${BASE_URL}/auctions/${id}/end`, { method: "PATCH" });
}

export function deleteAuction(id: string): Promise<void> {
  return request(`${BASE_URL}/auctions/${id}`, { method: "DELETE" });
}
