import { LoaderFunctionArgs } from "react-router-dom";
import { fetchAuctionBids } from "../auctions/services/auctionBidApi";
export async function auctionLeaderboardLoader({ params }: LoaderFunctionArgs) {
  const { auctionId } = params;
  if (!auctionId) throw new Response("Missing auctionId", { status: 400 });

  return fetchAuctionBids(auctionId);
}