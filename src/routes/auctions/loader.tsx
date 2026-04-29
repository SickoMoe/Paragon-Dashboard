import { BASE_URL } from "../../core/const";
import { AuctionOverview } from "../../features/auctions/types";
import {request} from "../../core/api/request.ts"

// src/routes/dashboard/loader.ts
export const auctionLoader = async (): Promise<AuctionOverview[]> => {
  const res = request<AuctionOverview[]>(`${BASE_URL}/auctions/views?status=all`);
  return res;
};




