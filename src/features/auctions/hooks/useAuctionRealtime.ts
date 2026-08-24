import { useEffect } from "react";
import {
  subscribeToAuctionRealtime,
  type AuctionRealtimeEvent,
} from "../services/auctionRealtime";

export function useAuctionRealtime(
  onEvent: (event: AuctionRealtimeEvent) => void,
) {
  useEffect(() => subscribeToAuctionRealtime(onEvent), [onEvent]);
}
