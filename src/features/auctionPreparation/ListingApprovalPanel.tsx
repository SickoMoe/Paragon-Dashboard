import { useEffect, useState } from "react";
import { request } from "../../core/api/request";
import type { IListing } from "../../interfaces/IListing";
import type { ListingDraftPayload } from "../auctions/types";
import type { AuctionDraftRecord } from "../auctions/services/auctionDashboardApi";
import { resolveListingMediaUrl } from "../auctions/utils/listingMedia";
type Review = {
  listingId: string;
  listingRevision: number;
  draftUpdatedAt: string;
  source: "seller_submission" | "current_property";
  reviewRequestId: string | null;
  reviewRevision: number | null;
  snapshot: ListingDraftPayload;
  hasPreviousApproval: boolean;
  propertyDiffers: boolean;
};
export function ListingApprovalPanel({
  draftId,
  onApproved,
  onCancel,
  onEdit,
  onDirtyChange,
}: {
  draftId: string;
  onApproved: (listing: IListing, draft: AuctionDraftRecord) => void;
  onCancel: () => void;
  onEdit: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [review, setReview] = useState<Review | null>(null),
    [error, setError] = useState(""),
    [terms, setTerms] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [saving, setSaving] = useState(false),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setReview(null);
    setError("");
    setConfirmed(false);
    request<Review>(`/api/drafts/auctions/${draftId}/listing-review`)
      .then((r) => {
        if (active) {
          setReview(r);
          setTerms(r.snapshot.termsAndConditions || "");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [draftId, version]);
  const dirty = Boolean(review && terms !== (review.snapshot.termsAndConditions || ""));
  useEffect(() => {
    onDirtyChange(dirty || saving);
    return () => onDirtyChange(false);
  }, [dirty, saving, onDirtyChange]);
  async function approve() {
    if (!review || !confirmed) return;
    setSaving(true);
    setError("");
    try {
      const next = await request<{ listing: IListing; draft: AuctionDraftRecord }>(
        `/api/drafts/auctions/${draftId}/approve-listing`,
        {
          method: "POST",
          body: JSON.stringify({
            listingRevision: review.listingRevision,
            draftUpdatedAt: review.draftUpdatedAt,
            reviewRequestId: review.reviewRequestId,
            reviewRevision: review.reviewRevision,
            termsAndConditions: terms,
          }),
        },
      );
      onApproved(next.listing, next.draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approval failed. Your review is still here.");
    } finally {
      setSaving(false);
    }
  }
  const p = review?.snapshot,
    location = p?.basicInformation?.location;
  return (
    <section className="preparation__approval" aria-label="Listing approval">
      <div className="preparation__sectionHeading">
        <div>
          <p className="preparation__eyebrow">Listing review</p>
          <h3>Approve the listing for this auction</h3>
        </div>
        <button disabled={saving} onClick={onCancel}>
          Back to property
        </button>
      </div>
      <p>
        Review the property and auction terms below. Approval saves a permanent review and keeps
        your auction pricing and schedule.
      </p>
      {error && (
        <p role="alert" className="preparation__error">
          {error}{" "}
          <button
            disabled={saving}
            onClick={() => {
              if (!dirty || window.confirm("Discard unsaved review terms and reload?"))
                setVersion((v) => v + 1);
            }}
          >
            Reload review
          </button>
        </p>
      )}
      {!review && !error && <p role="status">Loading the listing to review…</p>}
      {review && p && (
        <>
          <p className="preparation__hint">
            {review.source === "seller_submission"
              ? "Reviewing the pending seller submission."
              : "Reviewing the saved current property."}{" "}
            {review.hasPreviousApproval ? "The previous approved review stays in history." : ""}{" "}
            Confirmed map coordinates remain on the property.
          </p>
          {review.propertyDiffers && (
            <p className="preparation__warning">
              This seller submission differs from the current property. Approval records these
              submitted terms; it does not overwrite current property corrections.
            </p>
          )}
          <div className="preparation__reviewPhotos">
            {(p.media?.images || []).map((url, index) => (
              <img
                key={`${url}-${index}`}
                src={resolveListingMediaUrl(url)}
                alt={`Property photo ${index + 1}`}
              />
            ))}
          </div>
          <dl className="preparation__facts">
            <Detail label="Property" value={p.basicInformation?.title} />
            <Detail label="Type" value={p.basicInformation?.type} />
            <Detail
              label="Address"
              value={[location?.address, location?.city, location?.state, location?.zipcode]
                .filter(Boolean)
                .join(", ")}
            />
            <Detail label="Seller" value={p.contactInformation?.seller?.name} />
            <Detail
              label="Property details"
              value={`${p.propertyFeatures?.bedrooms ?? "—"} beds · ${p.propertyFeatures?.bathrooms ?? "—"} baths · ${p.propertyFeatures?.buildingSQFT || "—"} sq ft`}
            />
            <Detail label="Title / legal" value={p.legalInformation?.titleStatus} />
          </dl>
          <details>
            <summary>Full description & additional details</summary>
            <p>{p.description?.overview}</p>
            <p>{p.description?.detailedDescription}</p>
            <dl className="preparation__facts">
              <Detail label="Lot size" value={p.propertyFeatures?.lotSize} />
              <Detail
                label="Year built"
                value={String(p.propertyFeatures?.yearBuilt || "Not provided")}
              />
              <Detail label="Amenities" value={p.propertyFeatures?.amenities?.join(", ")} />
              <Detail label="Zoning" value={p.legalInformation?.zoningInformation} />
              <Detail label="Seller contact" value={p.contactInformation?.seller?.contactDetails} />
            </dl>
          </details>
          <label className="preparation__field">
            <span>Auction terms to approve</span>
            <textarea
              rows={6}
              value={terms}
              disabled={saving}
              onChange={(e) => {
                setTerms(e.target.value);
                setConfirmed(false);
              }}
            />
            <small>
              These terms are saved in the approved review. Enter the actual terms for this
              property.
            </small>
          </label>
          <label className="preparation__confirmation">
            <input
              type="checkbox"
              checked={confirmed}
              disabled={saving}
              onChange={(e) => setConfirmed(e.target.checked)}
            />{" "}
            I have reviewed this listing and its auction terms.
          </label>
          <div className="preparation__reviewActions">
            <button onClick={onEdit} disabled={saving}>
              Correct property information
            </button>
            <button
              className="preparation__primary"
              disabled={saving || !confirmed || !terms.trim()}
              onClick={() => void approve()}
            >
              {saving ? "Approving listing…" : "Approve listing & return to checklist"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "Not provided"}</dd>
    </div>
  );
}
