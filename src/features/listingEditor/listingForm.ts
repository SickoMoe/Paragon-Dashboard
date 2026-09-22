import type { IListing } from "../../interfaces/IListing";
import type { CreateListingInput, ListingPatch } from "../listingApi";
export type ListingFormState = {
  title: string;
  type: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  latitude: string;
  longitude: string;
  overview: string;
  detailedDescription: string;
  thumbnailUrl: string;
  images: string;
  bedrooms: string;
  bathrooms: string;
  buildingSQFT: string;
  lotSize: string;
  yearBuilt: string;
  amenities: string;
  titleStatus: string;
  zoningInformation: string;
  sellerName: string;
  sellerContact: string;
  biddingSupport: string;
  financingOptions: string;
  inspectionDetails: string;
  termsAndConditions: string;
  socialSharing: boolean;
  workflowStatus: "draft" | "published";
};

export function createBlankListingForm(): ListingFormState {
  return {
    title: "",
    type: "Residential",
    address: "",
    city: "",
    state: "",
    zipcode: "",
    latitude: "",
    longitude: "",
    overview: "",
    detailedDescription: "",
    thumbnailUrl: "",
    images: "",
    bedrooms: "0",
    bathrooms: "0",
    buildingSQFT: "",
    lotSize: "",
    yearBuilt: "",
    amenities: "",
    titleStatus: "",
    zoningInformation: "",
    sellerName: "",
    sellerContact: "",
    biddingSupport: "",
    financingOptions: "",
    inspectionDetails: "",
    termsAndConditions: "",
    socialSharing: true,
    workflowStatus: "draft",
  };
}

export function listingToForm(listing: IListing): ListingFormState {
  const location = listing.basicInformation?.location ?? {};
  return {
    title: listing.basicInformation.title ?? "",
    type: listing.basicInformation.type ?? "Residential",
    address: location.address ?? "",
    city: location.city ?? "",
    state: location.state ?? "",
    zipcode: location.zipcode ?? "",
    latitude: formatCoordinate(location.latitude),
    longitude: formatCoordinate(location.longitude),
    overview: listing.description?.overview ?? "",
    detailedDescription: listing.description?.detailedDescription ?? "",
    thumbnailUrl: listing.media?.thumbnailUrl ?? "",
    images: (listing.media?.images ?? []).join("\n"),
    bedrooms: String(listing.propertyFeatures?.bedrooms ?? 0),
    bathrooms: String(listing.propertyFeatures?.bathrooms ?? 0),
    buildingSQFT: listing.propertyFeatures?.buildingSQFT ?? "",
    lotSize: listing.propertyFeatures?.lotSize ?? "",
    yearBuilt: listing.propertyFeatures?.yearBuilt
      ? String(listing.propertyFeatures?.yearBuilt)
      : "",
    amenities: (listing.propertyFeatures?.amenities ?? []).join("\n"),
    titleStatus: listing.legalInformation?.titleStatus ?? "",
    zoningInformation: listing.legalInformation?.zoningInformation ?? "",
    sellerName: listing.contactInformation?.seller?.name ?? "",
    sellerContact: listing.contactInformation?.seller?.contactDetails ?? "",
    biddingSupport: listing.contactInformation?.biddingSupport?.contactDetails ?? "",
    financingOptions: (listing.additionalInformation?.financingOptions ?? []).join("\n"),
    inspectionDetails: listing.additionalInformation?.inspectionDetails ?? "",
    termsAndConditions: listing.termsAndConditions ?? "",
    socialSharing: Boolean(listing.socialSharing),
    workflowStatus: listing.workflowStatus === "published" ? "published" : "draft",
  };
}

export function listingFormToPatch(form: ListingFormState): ListingPatch {
  return {
    basicInformation: {
      title: form.title.trim(),
      type: form.type.trim(),
      location: {
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zipcode: form.zipcode.trim(),
        latitude: optionalNumber(form.latitude) as number,
        longitude: optionalNumber(form.longitude) as number,
      },
    },
    description: {
      overview: form.overview.trim(),
      detailedDescription: form.detailedDescription.trim(),
    },
    media: {
      thumbnailUrl: form.thumbnailUrl.trim(),
      images: splitLines(form.images),
    },
    propertyFeatures: {
      bedrooms: numberOrZero(form.bedrooms),
      bathrooms: numberOrZero(form.bathrooms),
      buildingSQFT: form.buildingSQFT.trim(),
      lotSize: form.lotSize.trim(),
      yearBuilt: numberOrZero(form.yearBuilt),
      amenities: splitLines(form.amenities),
    },
    legalInformation: {
      titleStatus: form.titleStatus.trim(),
      zoningInformation: form.zoningInformation.trim(),
    },
    contactInformation: {
      seller: {
        name: form.sellerName.trim(),
        contactDetails: form.sellerContact.trim(),
      },
      biddingSupport: {
        contactDetails: form.biddingSupport.trim(),
      },
    },
    additionalInformation: {
      financingOptions: splitLines(form.financingOptions),
      inspectionDetails: form.inspectionDetails.trim(),
    },
    socialSharing: form.socialSharing,
    termsAndConditions: form.termsAndConditions.trim(),
  };
}

export function listingFormToCreateInput(form: ListingFormState): CreateListingInput {
  const patch = listingFormToPatch(form);
  return {
    moderationStatus: "pending",
    workflowStatus: form.workflowStatus,
    basicInformation: patch.basicInformation as IListing["basicInformation"],
    description: patch.description as IListing["description"],
    media: {
      ...(patch.media as IListing["media"]),
      videos: [],
    },
    propertyFeatures: patch.propertyFeatures as IListing["propertyFeatures"],
    legalInformation: patch.legalInformation as IListing["legalInformation"],
    contactInformation: patch.contactInformation as IListing["contactInformation"],
    additionalInformation: patch.additionalInformation as IListing["additionalInformation"],
    socialSharing: Boolean(patch.socialSharing),
    termsAndConditions: String(patch.termsAndConditions ?? ""),
    tags: patch.tags ?? {},
  };
}

export function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}
function optionalNumber(value: string) {
  return value.trim() ? Number(value) : null;
}
function numberOrZero(value: string) {
  return value.trim() ? Number(value) : 0;
}
function formatCoordinate(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}
export function changedListingPatch(
  form: ListingFormState,
  original: ListingFormState,
): ListingPatch {
  function diff(next: any, previous: any): any {
    const changed: any = {};
    for (const key of Object.keys(next)) {
      const value = next[key],
        old = previous?.[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const nested = diff(value, old);
        if (Object.keys(nested).length) changed[key] = nested;
      } else if (JSON.stringify(value) !== JSON.stringify(old)) changed[key] = value;
    }
    return changed;
  }
  return diff(listingFormToPatch(form), listingFormToPatch(original));
}
export const listingSteps = ["Property", "Details", "Photos", "Seller / legal", "Terms & review"];
export type FormErrors = Partial<Record<keyof ListingFormState, string>>;
export const fieldPaths: Partial<Record<keyof ListingFormState, string>> = {
  title: "basicInformation.title",
  type: "basicInformation.type",
  address: "basicInformation.location.address",
  city: "basicInformation.location.city",
  state: "basicInformation.location.state",
  zipcode: "basicInformation.location.zipcode",
  latitude: "basicInformation.location.latitude",
  longitude: "basicInformation.location.longitude",
  overview: "description.overview",
  bedrooms: "propertyFeatures.bedrooms",
  bathrooms: "propertyFeatures.bathrooms",
  yearBuilt: "propertyFeatures.yearBuilt",
  images: "media.images",
};
export function validateForm(
  form: ListingFormState,
  complete = false,
  original?: ListingFormState,
): FormErrors {
  const errors: FormErrors = {};
  const changed = (key: keyof ListingFormState) => !original || form[key] !== original[key];
  if (complete || (original && changed("title")))
    for (const key of (complete
      ? ["title", "type", "address", "city", "state", "zipcode", "overview"]
      : ["title"]) as (keyof ListingFormState)[])
      if (!String(form[key]).trim()) errors[key] = "This field is required.";
  if (changed("zipcode") && form.zipcode && !/^\d{5}(-\d{4})?$/.test(form.zipcode))
    errors.zipcode = "Enter a five-digit ZIP or ZIP+4.";
  for (const key of ["bedrooms", "bathrooms", "yearBuilt"] as const)
    if (
      changed(key) &&
      form[key] &&
      (!Number.isFinite(Number(form[key])) ||
        Number(form[key]) < 0 ||
        (key !== "bathrooms" && !Number.isInteger(Number(form[key]))))
    )
      errors[key] = "Enter a valid non-negative number.";
  for (const [key, max] of [
    ["latitude", 90],
    ["longitude", 180],
  ] as const)
    if (
      changed(key) &&
      form[key] &&
      (!Number.isFinite(Number(form[key])) || Math.abs(Number(form[key])) > max)
    )
      errors[key] = `Enter a value between -${max} and ${max}.`;
  if (
    (changed("latitude") || changed("longitude")) &&
    (form.latitude === "") !== (form.longitude === "")
  ) {
    errors.latitude = "Provide both coordinates or clear both.";
    errors.longitude = errors.latitude;
  }
  return errors;
}
export function serverFormErrors(fields: Record<string, string> = {}): FormErrors {
  return Object.fromEntries(
    Object.entries(fieldPaths)
      .filter(([, path]) => Boolean(fields[path!]))
      .map(([key, path]) => [key, fields[path!]]),
  );
}
