// src/domain/entities/IListing.ts

export interface IListing {
  ownerAccountId: string;
  listingId: string;
  basicInformation: {
    title: string;
    type: string; // Residential, Commercial, Land, etc.
    location: {
      address: string;
      city: string;
      state: string;
      zipcode: string;
    };
  };
  description: {
    overview: string;
    detailedDescription: string;
  };
  media: {
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
