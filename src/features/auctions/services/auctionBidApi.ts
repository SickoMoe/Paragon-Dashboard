// src/routes/dashboard/services/auctionBidsApi.ts
import { request } from "../../../core/api/request";
import { BASE_URL } from "../../../core/const";

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

export function fetchAuctionBids(auctionId: string): Promise<AuctionLeaderboardDTO> {
  return request(`${BASE_URL}/auctions/${auctionId}/leaderboard`);
}
