import { useState, type CSSProperties, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { IListing } from "../../interfaces/IListing";
import type { CreateListingInput, ListingPatch } from "../listingApi";
import { inputStyle } from "../auctionDrawer/styles";

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
  const location = listing.basicInformation.location;
  return {
    title: listing.basicInformation.title ?? "",
    type: listing.basicInformation.type ?? "Residential",
    address: location.address ?? "",
    city: location.city ?? "",
    state: location.state ?? "",
    zipcode: location.zipcode ?? "",
    latitude: formatCoordinate(location.latitude),
    longitude: formatCoordinate(location.longitude),
    overview: listing.description.overview ?? "",
    detailedDescription: listing.description.detailedDescription ?? "",
    thumbnailUrl: listing.media.thumbnailUrl ?? "",
    images: (listing.media.images ?? []).join("\n"),
    bedrooms: String(listing.propertyFeatures.bedrooms ?? 0),
    bathrooms: String(listing.propertyFeatures.bathrooms ?? 0),
    buildingSQFT: listing.propertyFeatures.buildingSQFT ?? "",
    lotSize: listing.propertyFeatures.lotSize ?? "",
    yearBuilt: listing.propertyFeatures.yearBuilt
      ? String(listing.propertyFeatures.yearBuilt)
      : "",
    amenities: (listing.propertyFeatures.amenities ?? []).join("\n"),
    titleStatus: listing.legalInformation.titleStatus ?? "",
    zoningInformation: listing.legalInformation.zoningInformation ?? "",
    sellerName: listing.contactInformation.seller.name ?? "",
    sellerContact: listing.contactInformation.seller.contactDetails ?? "",
    biddingSupport:
      listing.contactInformation.biddingSupport.contactDetails ?? "",
    financingOptions: (
      listing.additionalInformation.financingOptions ?? []
    ).join("\n"),
    inspectionDetails:
      listing.additionalInformation.inspectionDetails ?? "",
    termsAndConditions: listing.termsAndConditions ?? "",
    socialSharing: Boolean(listing.socialSharing),
    workflowStatus:
      listing.workflowStatus === "published" ? "published" : "draft",
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
        latitude: optionalNumber(form.latitude),
        longitude: optionalNumber(form.longitude),
      },
    },
    description: {
      overview: form.overview.trim(),
      detailedDescription: form.detailedDescription.trim(),
    },
    media: {
      thumbnailUrl: form.thumbnailUrl.trim() || undefined,
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
      zoningInformation: form.zoningInformation.trim() || undefined,
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
      inspectionDetails: form.inspectionDetails.trim() || undefined,
    },
    socialSharing: form.socialSharing,
    termsAndConditions: form.termsAndConditions.trim(),
    tags: {
      type: form.type.trim().toLowerCase().replace(/\s+/g, "-"),
    },
  };
}

export function listingFormToCreateInput(
  form: ListingFormState,
): CreateListingInput {
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
    propertyFeatures:
      patch.propertyFeatures as IListing["propertyFeatures"],
    legalInformation: patch.legalInformation as IListing["legalInformation"],
    contactInformation:
      patch.contactInformation as IListing["contactInformation"],
    additionalInformation:
      patch.additionalInformation as IListing["additionalInformation"],
    socialSharing: Boolean(patch.socialSharing),
    termsAndConditions: String(patch.termsAndConditions ?? ""),
    tags: patch.tags ?? {},
  };
}

export function ListingFormFields({
  form,
  setForm,
  showWorkflow = false,
}: {
  form: ListingFormState;
  setForm: Dispatch<SetStateAction<ListingFormState>>;
  showWorkflow?: boolean;
}) {
  const [locationState, setLocationState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const update = <K extends keyof ListingFormState>(
    key: K,
    value: ListingFormState[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationState("error");
      return;
    }

    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setLocationState("success");
      },
      () => setLocationState("error"),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  };

  return (
    <div style={styles.form}>
      <FormSection title="Property">
        <div style={styles.twoColumns}>
          <Field label="Listing title">
            <input
              style={inputStyle}
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
            />
          </Field>
          <Field label="Property type">
            <select
              style={inputStyle}
              value={form.type}
              onChange={(event) => update("type", event.target.value)}
            >
              <option>Residential</option>
              <option>Condo</option>
              <option>Multi Family</option>
              <option>Commercial</option>
              <option>Land</option>
            </select>
          </Field>
        </div>
        <Field label="Street address">
          <input
            style={inputStyle}
            value={form.address}
            onChange={(event) => update("address", event.target.value)}
          />
        </Field>
        <div style={styles.locationGrid}>
          <Field label="City">
            <input
              style={inputStyle}
              value={form.city}
              onChange={(event) => update("city", event.target.value)}
            />
          </Field>
          <Field label="State">
            <input
              style={inputStyle}
              value={form.state}
              onChange={(event) => update("state", event.target.value)}
            />
          </Field>
          <Field label="Zip code">
            <input
              style={inputStyle}
              value={form.zipcode}
              onChange={(event) => update("zipcode", event.target.value)}
            />
          </Field>
        </div>
        <div style={styles.coordinateHeader}>
          <span style={styles.coordinateLabel}>Map coordinates</span>
          <button
            type="button"
            style={styles.locationButton}
            onClick={useCurrentLocation}
            disabled={locationState === "loading"}
          >
            {locationState === "loading" ? "Locating..." : "Use current location"}
          </button>
        </div>
        <div style={styles.twoColumns}>
          <Field label="Latitude">
            <input
              inputMode="decimal"
              style={inputStyle}
              value={form.latitude}
              onChange={(event) => update("latitude", event.target.value)}
            />
          </Field>
          <Field label="Longitude">
            <input
              inputMode="decimal"
              style={inputStyle}
              value={form.longitude}
              onChange={(event) => update("longitude", event.target.value)}
            />
          </Field>
        </div>
        {locationState === "success" ? (
          <span style={styles.success}>Coordinates added.</span>
        ) : null}
        {locationState === "error" ? (
          <span style={styles.error}>
            Location is unavailable. Enter coordinates manually.
          </span>
        ) : null}
      </FormSection>

      <FormSection title="Description">
        <Field label="Overview">
          <textarea
            style={styles.textarea}
            value={form.overview}
            onChange={(event) => update("overview", event.target.value)}
          />
        </Field>
        <Field label="Detailed description">
          <textarea
            style={{ ...styles.textarea, minHeight: 120 }}
            value={form.detailedDescription}
            onChange={(event) =>
              update("detailedDescription", event.target.value)
            }
          />
        </Field>
      </FormSection>

      <FormSection title="Media">
        <Field label="Thumbnail URL">
          <input
            style={inputStyle}
            value={form.thumbnailUrl}
            onChange={(event) => update("thumbnailUrl", event.target.value)}
          />
        </Field>
        <Field label="Image URLs, one per line">
          <textarea
            style={styles.textarea}
            value={form.images}
            onChange={(event) => update("images", event.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection title="Property details">
        <div style={styles.detailGrid}>
          <Field label="Bedrooms">
            <input
              type="number"
              min="0"
              step="1"
              style={inputStyle}
              value={form.bedrooms}
              onChange={(event) => update("bedrooms", event.target.value)}
            />
          </Field>
          <Field label="Bathrooms">
            <input
              type="number"
              min="0"
              step="0.5"
              style={inputStyle}
              value={form.bathrooms}
              onChange={(event) => update("bathrooms", event.target.value)}
            />
          </Field>
          <Field label="Square feet">
            <input
              style={inputStyle}
              value={form.buildingSQFT}
              onChange={(event) => update("buildingSQFT", event.target.value)}
            />
          </Field>
          <Field label="Lot size">
            <input
              style={inputStyle}
              value={form.lotSize}
              onChange={(event) => update("lotSize", event.target.value)}
            />
          </Field>
          <Field label="Year built">
            <input
              type="number"
              min="0"
              style={inputStyle}
              value={form.yearBuilt}
              onChange={(event) => update("yearBuilt", event.target.value)}
            />
          </Field>
        </div>
        <Field label="Amenities, one per line">
          <textarea
            style={styles.textarea}
            value={form.amenities}
            onChange={(event) => update("amenities", event.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection title="Legal and sale details">
        <div style={styles.twoColumns}>
          <Field label="Title status">
            <input
              style={inputStyle}
              value={form.titleStatus}
              onChange={(event) => update("titleStatus", event.target.value)}
            />
          </Field>
          <Field label="Zoning">
            <input
              style={inputStyle}
              value={form.zoningInformation}
              onChange={(event) =>
                update("zoningInformation", event.target.value)
              }
            />
          </Field>
        </div>
        <Field label="Inspection details">
          <textarea
            style={styles.textarea}
            value={form.inspectionDetails}
            onChange={(event) =>
              update("inspectionDetails", event.target.value)
            }
          />
        </Field>
        <Field label="Financing options, one per line">
          <textarea
            style={styles.textarea}
            value={form.financingOptions}
            onChange={(event) =>
              update("financingOptions", event.target.value)
            }
          />
        </Field>
        <Field label="Terms and conditions">
          <textarea
            style={{ ...styles.textarea, minHeight: 110 }}
            value={form.termsAndConditions}
            onChange={(event) =>
              update("termsAndConditions", event.target.value)
            }
          />
        </Field>
      </FormSection>

      <FormSection title="Contacts">
        <div style={styles.twoColumns}>
          <Field label="Seller name">
            <input
              style={inputStyle}
              value={form.sellerName}
              onChange={(event) => update("sellerName", event.target.value)}
            />
          </Field>
          <Field label="Seller contact">
            <input
              style={inputStyle}
              value={form.sellerContact}
              onChange={(event) => update("sellerContact", event.target.value)}
            />
          </Field>
        </div>
        <Field label="Bidding support contact">
          <input
            style={inputStyle}
            value={form.biddingSupport}
            onChange={(event) => update("biddingSupport", event.target.value)}
          />
        </Field>
        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={form.socialSharing}
            onChange={(event) =>
              update("socialSharing", event.target.checked)
            }
          />
          Allow social sharing
        </label>
      </FormSection>

      {showWorkflow ? (
        <FormSection title="Publication">
          <Field label="Create as">
            <select
              style={inputStyle}
              value={form.workflowStatus}
              onChange={(event) =>
                update(
                  "workflowStatus",
                  event.target.value as ListingFormState["workflowStatus"],
                )
              }
            >
              <option value="draft">Draft listing</option>
              <option value="published">Published listing</option>
            </select>
          </Field>
        </FormSection>
      ) : null}
    </div>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset style={styles.section}>
      <legend style={styles.legend}>{title}</legend>
      <div style={styles.sectionBody}>{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

function splitLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function numberOrZero(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatCoordinate(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

const styles: Record<string, CSSProperties> = {
  form: {
    display: "grid",
    gap: 22,
  },
  section: {
    minWidth: 0,
    margin: 0,
    padding: "20px 0 0",
    border: 0,
    borderTop: "1px solid var(--dash-border)",
  },
  legend: {
    padding: "0 12px 0 0",
    color: "var(--dash-ink)",
    fontSize: 14,
    fontWeight: 800,
  },
  sectionBody: {
    display: "grid",
    gap: 12,
  },
  twoColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  locationGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 110px 130px",
    gap: 12,
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
  },
  field: {
    minWidth: 0,
    display: "grid",
    gap: 6,
  },
  label: {
    color: "var(--dash-muted)",
    fontSize: 12,
    fontWeight: 650,
  },
  textarea: {
    ...inputStyle,
    minHeight: 82,
    paddingTop: 10,
    paddingBottom: 10,
    resize: "vertical",
    lineHeight: 1.45,
  },
  coordinateHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  coordinateLabel: {
    color: "var(--dash-muted)",
    fontSize: 12,
    fontWeight: 700,
  },
  locationButton: {
    minHeight: 34,
    padding: "0 12px",
    border: "1px solid var(--dash-border)",
    borderRadius: 6,
    background: "var(--dash-card)",
    color: "var(--dash-ink)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  },
  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "var(--dash-ink)",
    fontSize: 13,
  },
  success: {
    color: "var(--dash-success)",
    fontSize: 12,
    fontWeight: 700,
  },
  error: {
    color: "var(--dash-danger)",
    fontSize: 12,
    fontWeight: 700,
  },
};
