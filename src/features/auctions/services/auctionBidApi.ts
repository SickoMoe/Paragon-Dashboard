import { request } from "../../../core/api/request";
import { BASE_URL } from "../../../core/const";

export type BidDTO = {
  id: string;
  auctionId: string;
  bidderProfileId: string;
  amount: number;
  createdAt: string;
  source?: "user" | "auto" | "admin" | "system";
  status?: "accepted" | "voided";
  adminNote?: string;
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
};

export type AuctionLeaderboardDTO = {
  auctionId: string;
  openingBid: number;
  incrementAmount: number;
  currentBid: number;
  hasReserve?: boolean;
  reserveMet?: boolean;
  bids: BidDTO[];
  voidedBids?: BidDTO[];
  monitoring?: {
    visibility: "public" | "private";
    authorizedUsers: Array<{
      accountId: string;
      username?: string;
      email?: string;
      bidderStatus: string;
      verificationStatus?: string;
      biddingEligibility: boolean;
    }>;
    participants: Array<{
      bidderProfileId: string;
      accountId?: string;
      bidderStatus: string;
      verificationStatus?: string;
      biddingEligibility: boolean;
      restriction?: string;
    }>;
  };
};

export function fetchAuctionBids(
  auctionId: string,
): Promise<AuctionLeaderboardDTO> {
  return request(
    `${BASE_URL}/auctions/${encodeURIComponent(auctionId)}/bids/manage`,
  );
}

export function recordAdminBid(
  auctionId: string,
  input: {
    bidderProfileId: string;
    amount: number;
    adminNote?: string;
  },
): Promise<AuctionLeaderboardDTO> {
  return request(
    `${BASE_URL}/auctions/${encodeURIComponent(auctionId)}/bids/manage`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function voidAuctionBid(
  auctionId: string,
  bidId: string,
  reason: string,
): Promise<AuctionLeaderboardDTO> {
  return request(
    `${BASE_URL}/auctions/${encodeURIComponent(auctionId)}/bids/${encodeURIComponent(bidId)}/void`,
    {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    },
  );
}
