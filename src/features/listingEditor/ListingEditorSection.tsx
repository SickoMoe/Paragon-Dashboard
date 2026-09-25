import { useCallback, useEffect, useRef, useState } from "react";
import type { IListing } from "../../interfaces/IListing";
import { fetchManagedListing, patchListing } from "../listingApi";
import { ListingFormFields } from "./ListingFormFields";
import {
  changedListingPatch,
  listingToForm,
  serverFormErrors,
  validateForm,
  type FormErrors,
} from "./listingForm";

type Failure = {
  details?: {
    fields?: Record<string, string>;
    code?: string;
    affectedAuctions?: { id: string; status: string }[];
    changedFields?: string[];
  };
};
export function ListingEditorSection({
  listing,
  onUpdated,
  onDirtyChange,
}: {
  listing: IListing;
  onUpdated: (listing: IListing) => void;
  onDirtyChange?: (dirty: boolean) => void;
  allowPublish?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [current, setCurrent] = useState(listing);
  const [baseline, setBaseline] = useState(() => listingToForm(listing));
  const [form, setForm] = useState(baseline);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [positioning, setPositioning] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [impact, setImpact] = useState<Failure["details"] | null>(null);
  const [reason, setReason] = useState("");
  const [conflict, setConflict] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const notify = useRef(onDirtyChange);
  notify.current = onDirtyChange;
  const load = useCallback(async () => {
    setLoading(true);
    setLoaded(false);
    try {
      const data = await fetchManagedListing(listing.listingId);
      setLoaded(true);
      setCurrent(data);
      const next = listingToForm(data);
      setBaseline(next);
      setForm(next);
      setConflict(false);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load current property data.");
    } finally {
      setLoading(false);
    }
  }, [listing.listingId]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    notify.current?.(dirty || uploading || positioning || saving);
    return () => notify.current?.(false);
  }, [dirty, uploading, positioning, saving]);
  useEffect(() => {
    if (!dirty && !uploading && !positioning && !saving) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, uploading, positioning, saving]);
  async function save(confirmed = false) {
    if (positioning) return;
    const validation = validateForm(form, false, baseline);
    setErrors(validation);
    setError("");
    setMessage("");
    if (Object.keys(validation).length) {
      setError("Check the highlighted fields.");
      setStep(
        Object.keys(validation).some((key) =>
          ["bedrooms", "bathrooms", "yearBuilt", "overview"].includes(key),
        )
          ? 1
          : 0,
      );
      return;
    }
    setSaving(true);
    try {
      const next = await patchListing(current.listingId, {
        ...changedListingPatch(form, baseline),
        expectedRevision: current.revision,
        ...(confirmed ? { correctionReason: reason } : {}),
      });
      setCurrent(next);
      const saved = listingToForm(next);
      setForm(saved);
      setBaseline(saved);
      setImpact(null);
      setReason("");
      onUpdated(next);
      setMessage(
        "Property changes saved. Seller submissions and approved snapshots are unchanged.",
      );
    } catch (e) {
      const details = (e as Failure).details;
      setErrors(serverFormErrors(details?.fields));
      if (details?.code === "auction_correction_required") setImpact(details);
      else {
        setError(e instanceof Error ? e.message : "Save failed. Your changes are still here.");
        setConflict(details?.code === "listing_conflict");
      }
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="listing-editor-panel">
      <header>
        <p className="listing-eyebrow">Current operational listing</p>
        <h3>Correct property information</h3>
        <p className="listing-hint">
          Changes update the current property record. Original seller submissions and approved
          review snapshots remain unchanged.
        </p>
      </header>
      {loading ? (
        <p role="status">Loading current property data…</p>
      ) : loaded ? (
        <ListingFormFields
          form={form}
          setForm={setForm}
          step={step}
          onStepChange={setStep}
          errors={errors}
          onBusyChange={setUploading}
          onLocationPendingChange={setPositioning}
          disabled={saving}
        />
      ) : (
        <button type="button" onClick={() => void load()}>
          Retry loading property
        </button>
      )}
      {error ? (
        <p className="listing-error" role="alert">
          {error}
        </p>
      ) : null}
      {message && !dirty ? (
        <p className="listing-success" role="status">
          {message}
        </p>
      ) : null}
      {conflict ? (
        <button
          type="button"
          onClick={() => {
            if (!dirty || window.confirm("Reload current data and discard your unsaved changes?"))
              void load();
          }}
        >
          Reload current property
        </button>
      ) : null}
      {impact ? (
        <div className="listing-warning">
          <h4>Review correction impact</h4>
          <p>
            This property has {impact.affectedAuctions?.map((a) => a.status).join(", ")} auctions.
            Saving changes the current information bidders see; auction dates, bids and approved
            terms are unchanged.
          </p>
          <p>
            Verify the correction before proceeding. For changes that alter what is being sold,
            pause or cancel the auction from Auction Management first.
          </p>
          <label>
            Correction reason
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
          </label>
          <button type="button" disabled={saving} onClick={() => setImpact(null)}>
            Keep editing
          </button>
          <button
            type="button"
            disabled={saving || uploading || positioning || !reason.trim()}
            onClick={() => void save(true)}
          >
            Confirm correction & save
          </button>
        </div>
      ) : null}
      {positioning && (
        <p role="status" className="listing-warning">
          Confirm the property location on the map, or cancel the adjustment, before saving.
        </p>
      )}
      <footer className="listing-editor__footer">
        <span role="status">
          {saving
            ? "Saving…"
            : uploading
              ? "Uploading photos…"
              : dirty
                ? "Unsaved property changes"
                : message
                  ? "Saved"
                  : "No unsaved changes"}
        </span>
        <button
          type="button"
          disabled={!dirty || saving || uploading || positioning || loading}
          onClick={() => {
            setForm(baseline);
            setImpact(null);
            setErrors({});
            setError("");
          }}
        >
          Reset changes
        </button>
        <button
          type="button"
          className="listing-primary"
          disabled={
            !dirty ||
            saving ||
            uploading ||
            positioning ||
            loading ||
            !loaded ||
            conflict ||
            Boolean(impact)
          }
          onClick={() => void save()}
        >
          {saving ? "Saving…" : "Save property changes"}
        </button>
      </footer>
    </section>
  );
}
