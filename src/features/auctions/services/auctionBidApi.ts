// src/routes/dashboard/services/auctionBidsApi.ts
export type BidDTO = {
  id: string;
  auctionId: string;
  bidderProfileId: string;
  amount: number;
  createdAt: string;
  source?: string;
};

export type AuctionLeaderboardDTO = {
  auctionId: string;
  openingBid: number;
  incrementAmount: number;
  currentBid: number;
  bids: BidDTO[];
};

const BASE_URL = "http://localhost:3001/api/auctions";

async function request<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export function fetchAuctionBids(auctionId: string): Promise<AuctionLeaderboardDTO> {
  return request(`${BASE_URL}/${auctionId}/leaderboard`);
}