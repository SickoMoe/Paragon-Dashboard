import type { IListing } from "../../../interfaces/IListing";
import { appEnv } from "../../../core/config/env";

const URL_SCHEME_RE = /^[a-z][a-z\d+\-.]*:/i;
const AUCTION_SCOPED_IMAGE_RE = /^\/?auctions\/[^/]+\/(images\/.+)$/i;

export function getListingThumbnailPath(listing?: IListing | null) {
  return normalizeListingMediaPath(listing?.media?.thumbnailUrl || listing?.media?.images?.[0] || "");
}

export function getListingThumbnail(listing?: IListing | null) {
  return resolveListingMediaUrl(getListingThumbnailPath(listing));
}

export function resolveListingMediaUrl(value: string, baseUrl = appEnv.apiBaseUrl) {
  const path = normalizeListingMediaPath(value);
  if (!path) return "";
  if (isExternalUrl(path)) return path;

  const absolutePath = path.startsWith("/") ? path : `/${path}`;
  const base = baseUrl.trim();
  if (!base) return absolutePath;

  try {
    return new URL(absolutePath, resolveBaseUrl(base)).toString();
  } catch {
    return absolutePath;
  }
}

function normalizeListingMediaPath(value: string) {
  const path = value.trim();
  if (!path || isExternalUrl(path)) return path;

  const auctionScopedMatch = path.match(AUCTION_SCOPED_IMAGE_RE);
  if (auctionScopedMatch) return `/${auctionScopedMatch[1]}`;

  if (path.startsWith("images/")) return `/${path}`;
  return path;
}

function isExternalUrl(value: string) {
  return URL_SCHEME_RE.test(value) || value.startsWith("//");
}

function resolveBaseUrl(baseUrl: string) {
  if (URL_SCHEME_RE.test(baseUrl) || baseUrl.startsWith("//")) return baseUrl;
  const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
  return new URL(baseUrl, origin).toString();
}
