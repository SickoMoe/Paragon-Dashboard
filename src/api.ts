// src/features/admin/bidders/api.ts

import { request } from "./core/api/request";
import { BASE_URL } from "./core/const";

export async function fetchBidderApplications(status: string) {
  return request<{ rows: any[] }>(
    `${BASE_URL}{encodeURIComponent(status)}`
  );
}