import { request } from "../core/api/request";
import { BASE_URL } from "../core/const";
import { IListing } from "../interfaces/IListing";
import type { ListingDraftPayload, ListingReviewRequestStatus } from "./auctions/types";

export type ListingModerationStatus = "pending" | "approved" | "denied" | "removed";

export function updateListingStatus(
  listing: IListing,
  status: ListingModerationStatus,
): Promise<IListing> {
  return patchListing(listing.listingId, {
    moderationStatus: status,
    tags: {
      ...(listing.tags ?? {}),
      status,
    },
  } as ListingPatch);
}

export type ListingPatch = Partial<
  Omit<
    IListing,
    | "listingId"
    | "ownerAccountId"
    | "basicInformation"
    | "description"
    | "media"
    | "propertyFeatures"
    | "legalInformation"
    | "contactInformation"
    | "additionalInformation"
    | "tags"
  >
> & {
  expectedRevision?: number;
  correctionReason?: string;
  basicInformation?: Partial<Omit<IListing["basicInformation"], "location">> & {
    location?: Partial<IListing["basicInformation"]["location"]>;
  };
  description?: Partial<IListing["description"]>;
  media?: Partial<IListing["media"]>;
  propertyFeatures?: Partial<IListing["propertyFeatures"]>;
  legalInformation?: Partial<IListing["legalInformation"]>;
  contactInformation?: {
    seller?: Partial<IListing["contactInformation"]["seller"]>;
    biddingSupport?: Partial<IListing["contactInformation"]["biddingSupport"]>;
  };
  additionalInformation?: Partial<IListing["additionalInformation"]>;
  tags?: Record<string, string>;
};

export function patchListing(listingId: string, patch: ListingPatch): Promise<IListing> {
  return request<IListing>(`${BASE_URL}/listings/${listingId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export type CreateListingInput = Omit<IListing, "listingId" | "ownerAccountId"> & {
  ownerAccountId?: string;
};

export function fetchManagedListing(id: string): Promise<IListing> {
  return request(`${BASE_URL}/listings/manage/${encodeURIComponent(id)}`);
}

export function fetchManagedListings(): Promise<IListing[]> {
  return request<IListing[]>(`${BASE_URL}/listings/manage`);
}

export function createListing(input: CreateListingInput): Promise<IListing> {
  return request<IListing>(`${BASE_URL}/listings`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function publishListing(listingId: string): Promise<IListing> {
  return request<IListing>(`${BASE_URL}/listings/${listingId}/publish`, {
    method: "PATCH",
  });
}

export type ListingReviewFieldIssue = {
  issueId: string;
  fieldPath?: string;
  message: string;
  severity: "blocking" | "advisory";
};

export type ListingReviewRequest = {
  reviewRequestId: string;
  draftId: string;
  ownerAccountId?: string;
  listingId: string;
  status: ListingReviewRequestStatus;
  submissionNumber: number;
  submittedBy: string;
  submittedAt: string;
  submittedDraftRevision: number;
  submittedSnapshot: ListingDraftPayload;
  submittedSnapshotHash: string;
  adminEditedSnapshot?: ListingDraftPayload;
  approvedSnapshot?: ListingDraftPayload;
  generalMessage?: string;
  fieldIssues?: ListingReviewFieldIssue[];
  reviewReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  withdrawnBy?: string;
  withdrawnAt?: string;
  withdrawalReason?: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type ListingDraftReviewResult = {
  request: ListingReviewRequest;
  listing?: IListing | null;
};

export function approveListingDraft(
  draftId: string,
  expectedRevision?: number,
): Promise<ListingDraftReviewResult> {
  return request<ListingDraftReviewResult>(`${BASE_URL}/drafts/listings/${draftId}/approve`, {
    method: "POST",
    body: JSON.stringify({ expectedRevision }),
  });
}

export function requestListingDraftChanges(
  draftId: string,
  generalMessage: string,
  expectedRevision?: number,
  fieldIssues: ListingReviewFieldIssue[] = [],
): Promise<ListingReviewRequest> {
  return request<ListingReviewRequest>(`${BASE_URL}/drafts/listings/${draftId}/request-changes`, {
    method: "POST",
    body: JSON.stringify({ generalMessage, expectedRevision, fieldIssues }),
  });
}

export function rejectListingDraft(
  draftId: string,
  reason: string,
  expectedRevision?: number,
): Promise<ListingDraftReviewResult> {
  return request<ListingDraftReviewResult>(`${BASE_URL}/drafts/listings/${draftId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason, expectedRevision }),
  });
}

export function updateListingReviewRequest(
  reviewRequestId: string,
  payload: {
    expectedRevision?: number;
    generalMessage?: string;
    fieldIssues?: ListingReviewFieldIssue[];
    adminEditedSnapshot?: ListingDraftPayload;
  },
): Promise<ListingReviewRequest> {
  return request<ListingReviewRequest>(`${BASE_URL}/drafts/listings/${reviewRequestId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
