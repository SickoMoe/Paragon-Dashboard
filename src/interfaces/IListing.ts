// src/domain/entities/IListing.ts

export interface IListing {
  revision?: number;
  reviewState?: { approvedReviewRequestId?: string; hasNewerMaterialChanges?: boolean };
  ownerAccountId: string;
  listingId: string;
  moderationStatus?: "pending" | "approved" | "denied" | "removed";
  workflowStatus?: "draft" | "submitted" | "published" | "archived";
  basicInformation: {
    title: string;
    type: string; // Residential, Commercial, Land, etc.
    location: {
      address: string;
      city: string;
      state: string;
      zipcode: string;
      latitude?: number;
      longitude?: number;
      coordinateSource?: "geocoded" | "manual";
    };
  };
  description: {
    overview: string;
    detailedDescription: string;
  };
  media: {
    thumbnailUrl?: string;
    images: string[]; // URLs of images
    videos?: string[]; // URLs of videos
  };
  propertyFeatures: {
    bedrooms: number;
    bathrooms: number;
    buildingSQFT: string;
    lotSize: string;
    yearBuilt: number;
    amenities: string[];
  };
  legalInformation: {
    titleStatus: string;
    zoningInformation?: string;
  };
  contactInformation: {
    seller: {
      name: string;
      contactDetails: string;
    };
    biddingSupport: {
      contactDetails: string;
    };
  };
  additionalInformation: {
    financingOptions?: string[];
    inspectionDetails?: string;
  };
  socialSharing: boolean;
  termsAndConditions: string;
  tags: Record<string, string>;
}
