// src/routes/dashboard/services/auctionDashboardApi.ts
import { AuctionOverview } from "../types";
import type { IAuction, AuctionRules } from "../../../interfaces/IAuction";

const BASE_URL = "http://localhost:3001/api/auctions";

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
  endDate?: string;   // ISO
  status?: IAuction["status"]; // usually "draft" or "scheduled"
}
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  if (!res.ok) {
    const msg = await safeError(res);
    throw new Error(msg || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

async function safeError(res: Response) {
  try {
    const j = await res.json();
    return j?.error || j?.message;
  } catch {
    return "";
  }
}

export function patchAuction(id: string, patch: AuctionPatch): Promise<IAuction> {
  return request(`${BASE_URL}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
export async function createAuction(
  input: AuctionCreateInput
): Promise<AuctionOverview> {
  const res = await fetch("http://localhost:3001/api/drafts/auctions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-dev-account-id": "dev-admin-001",
      "x-dev-session-id": "dev-admin-001",
      "x-dev-user-type": "admin",
    },
    body: JSON.stringify(input),
    credentials: "include",
  });

  const data = await res.json();

  // 🔑 normalize response shape
  if (Array.isArray(data)) {
    return data[0];
  }

  return data;
}
export function updateAuctionSchedule(
  id: string,
  startDate: string,
  endDate: string
): Promise<IAuction> {
  return request(`${BASE_URL}/${id}/schedule`, {
    method: "PATCH",
    body: JSON.stringify({ startDate, endDate }),
  });
}

export function publishAuction(id: string): Promise<IAuction> {
  return request(`${BASE_URL}/${id}/publish`, { method: "PATCH" });
}

export function endAuction(id: string): Promise<IAuction> {
  return request(`${BASE_URL}/${id}/end`, { method: "PATCH" });
}

export function deleteAuction(id: string): Promise<void> {
  return request(`${BASE_URL}/${id}`, { method: "DELETE" });
}