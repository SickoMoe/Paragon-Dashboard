import { request } from "../core/api/request";
import { BASE_URL } from "../core/const";
import { IListing } from "../interfaces/IListing";

export type ListingModerationStatus = "pending" | "approved" | "denied" | "removed";

export function updateListingStatus(
  listing: IListing,
  status: ListingModerationStatus
): Promise<IListing> {
  return patchListing(listing.listingId, {
    moderationStatus: status,
    tags: {
      ...(listing.tags ?? {}),
      status,
    },
  } as ListingPatch);
}

export type ListingPatch = Partial<IListing> & {
  basicInformation?: Partial<IListing["basicInformation"]> & {
    location?: Partial<IListing["basicInformation"]["location"]>;
  };
  media?: Partial<IListing["media"]>;
  tags?: Record<string, string>;
};

export function patchListing(listingId: string, patch: ListingPatch): Promise<IListing> {
  return request<IListing>(`${BASE_URL}/listings/${listingId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
