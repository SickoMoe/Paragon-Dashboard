import { appEnv } from "../../../core/config/env";
import type { IAuction } from "../../../interfaces/IAuction";
import type { AuctionOverview } from "../types";
import type { AuctionLeaderboardDTO, BidDTO } from "./auctionBidApi";

export type AuctionRealtimeEventType =
  | "auction.created"
  | "auction.updated"
  | "auction.deleted"
  | "auction.statusChanged"
  | "auction.leaderboardUpdated"
  | "bid.created";

export type AuctionRealtimeEvent = {
  type: AuctionRealtimeEventType;
  auctionId?: string;
  payload?: {
    auction?: IAuction;
    auctionId?: string;
    bidSnapshot?: AuctionOverview["bid"];
    latestBid?: BidDTO | null;
    leaderboard?: AuctionLeaderboardDTO;
    view?: AuctionOverview;
    [key: string]: unknown;
  };
  occurredAt: string;
};

type AuctionRealtimeHandler = (event: AuctionRealtimeEvent) => void;

export function subscribeToAuctionRealtime(onEvent: AuctionRealtimeHandler) {
  if (typeof window === "undefined" || typeof WebSocket === "undefined") {
    return () => {};
  }

  let closed = false;
  let socket: WebSocket | null = null;
  let retryTimer: number | undefined;
  let attempts = 0;

  const connect = () => {
    socket = new WebSocket(appEnv.realtimeUrl);

    socket.addEventListener("open", () => {
      attempts = 0;
      socket?.send(JSON.stringify({ type: "subscribe.auctions", auctionIds: [] }));
    });

    socket.addEventListener("message", (event) => {
      const parsed = parseAuctionRealtimeEvent(event.data);
      if (parsed) onEvent(parsed);
    });

    socket.addEventListener("close", () => {
      if (closed) return;
      const delay = Math.min(1000 * 2 ** attempts, 10000);
      attempts += 1;
      retryTimer = window.setTimeout(connect, delay);
    });
  };

  connect();

  return () => {
    closed = true;
    if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    socket?.close();
  };
}

function parseAuctionRealtimeEvent(data: unknown): AuctionRealtimeEvent | null {
  if (typeof data !== "string") return null;

  try {
    const parsed = JSON.parse(data) as Partial<AuctionRealtimeEvent>;
    if (!isAuctionEventType(parsed.type)) return null;
    if (typeof parsed.occurredAt !== "string") return null;
    return parsed as AuctionRealtimeEvent;
  } catch {
    return null;
  }
}

function isAuctionEventType(value: unknown): value is AuctionRealtimeEventType {
  return (
    value === "auction.created" ||
    value === "auction.updated" ||
    value === "auction.deleted" ||
    value === "auction.statusChanged" ||
    value === "auction.leaderboardUpdated" ||
    value === "bid.created"
  );
}
