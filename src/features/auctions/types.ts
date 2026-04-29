import { IAuction } from "../../interfaces/IAuction";
import { IListing } from "../../interfaces/IListing";
import { AuctionLeaderboardDTO, BidDTO } from "./services/auctionBidApi";

export type AuctionOverview = {
  auction: IAuction;
  listing: IListing;
  bid: {
    openingBid: number;
    incrementAmount: number;
    currentBid: number;
    bidCount: number;
  };
};