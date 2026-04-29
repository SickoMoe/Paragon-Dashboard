// src/core/rootLoader.ts
import { request } from "./core/api/request";

export type RootLoaderData = {
  bidderApplications: any[];
};

export async function rootLoader(): Promise<RootLoaderData> {
  const bidderApplications = await request<{ rows: any[] }>(
    "/api/bidder/applications?status=all"
  ).then((r) => (Array.isArray(r?.rows) ? r.rows : []));

  return { bidderApplications };
}