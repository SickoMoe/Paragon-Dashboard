import { IAuction } from "../../interfaces/IAuction";
import { IListing } from "../../interfaces/IListing";

export type ListingDraftStatus = "draft" | "pending" | "changes_requested" | "approved" | "rejected";
export type ListingReviewRequestStatus =
  | "pending"
  | "superseded"
  | "approved"
  | "changes_requested"
  | "rejected"
  | "withdrawn";

export type ListingDraftPayload = Pick<
  IListing,
  | "basicInformation"
  | "description"
  | "media"
  | "propertyFeatures"
  | "legalInformation"
  | "contactInformation"
  | "additionalInformation"
  | "socialSharing"
  | "termsAndConditions"
>;

export type ListingReview = {
  status: string;
  workflowStatus?: string;
  ownerAccountId: string;
  requestedBy: {
    accountId: string;
    username?: string;
    userType?: string;
    createdAt?: string;
  } | null;
  request: {
    reviewRequestId?: string;
    draftId?: string;
    status?: ListingReviewRequestStatus | ListingDraftStatus | string;
    submissionNumber?: number;
    submittedDraftRevision?: number;
    submittedSnapshotHash?: string;
    revision?: number;
    submittedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    reviewReason?: string;
    generalMessage?: string;
    fieldIssues?: Array<{
      issueId: string;
      fieldPath?: string;
      message: string;
      severity: "blocking" | "advisory";
    }>;
    title?: string;
    thumbnailUrl?: string;
    data?: ListingDraftPayload;
    submittedSnapshot?: ListingDraftPayload;
    adminEditedSnapshot?: ListingDraftPayload;
    approvedSnapshot?: ListingDraftPayload;
  } | null;
  workingDraft?: {
    draftId: string;
    status: string;
    revision?: number;
    updatedAt?: string;
    data: ListingDraftPayload;
  } | null;
  approvedSnapshot?: ListingDraftPayload;
  history?: Array<NonNullable<ListingReview["request"]>>;
};

export type AuctionOverview = {
  preparationReadiness?: import("../auctionPreparation/preparation").Readiness;
  auction: IAuction;
  listing: IListing;
  auctionDraft?: {
    id: string;
    ownerAccountId: string;
    status: string;
    auctionId?: string;
    payload?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
  };
  bid: {
    openingBid: number;
    incrementAmount: number;
    currentBid: number;
    bidCount: number;
  };
  listingReview?: ListingReview;
};
