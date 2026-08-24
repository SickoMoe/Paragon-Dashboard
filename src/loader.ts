// src/core/rootLoader.ts
import { request } from "./core/api/request";

export type RootLoaderData = {
  bidderApplications: any[];
  listingReviewConversations: any[];
  auctionQuestionConversations: any[];
};

async function safeLoad<T>(label: string, task: Promise<T>, fallback: T): Promise<T> {
  try {
    return await task;
  } catch (err) {
    console.error("Failed to load " + label + ":", err);
    return fallback;
  }
}

export async function rootLoader(): Promise<RootLoaderData> {
  const [bidderApplications, listingReviewConversations, auctionQuestionConversations] =
    await Promise.all([
      safeLoad(
        "bidder applications",
        request<{ rows: any[] }>("/api/bidder/applications?status=all").then((r) =>
          Array.isArray(r?.rows) ? r.rows : [],
        ),
        [],
      ),
      safeLoad(
        "listing conversations",
        request<{ conversations: any[] }>("/api/admin/messages/listings?status=all").then((r) =>
          Array.isArray(r?.conversations) ? r.conversations : [],
        ),
        [],
      ),
      safeLoad(
        "auction questions",
        request<{ conversations: any[] }>("/api/admin/messages/questions?status=all").then((r) =>
          Array.isArray(r?.conversations) ? r.conversations : [],
        ),
        [],
      ),
    ]);

  return {
    bidderApplications,
    listingReviewConversations,
    auctionQuestionConversations,
  };
}
