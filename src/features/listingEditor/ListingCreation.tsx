import { useEffect, useRef, useState } from "react";
import type { IListing } from "../../interfaces/IListing";
import { createListing, fetchManagedListing, patchListing } from "../listingApi";
import { ListingFormFields } from "./ListingFormFields";
import {
  changedListingPatch,
  createBlankListingForm,
  listingToForm,
  listingFormToCreateInput,
  serverFormErrors,
  validateForm,
  type FormErrors,
} from "./listingForm";
const DRAFT_KEY = "paragon:admin-property-draft:v1";
export default function ListingCreation({
  onCreated,
  onDirtyChange,
}: {
  onCreated: (listing: IListing) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [form, setForm] = useState(createBlankListingForm);
  const [baseline, setBaseline] = useState(createBlankListingForm);
  const [saved, setSaved] = useState<IListing | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [positioning, setPositioning] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const notify = useRef(onDirtyChange);
  notify.current = onDirtyChange;
  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const id = localStorage.getItem(DRAFT_KEY);
        if (id) {
          const listing = await fetchManagedListing(id);
          if (active) {
            setSaved(listing);
            const next = listingToForm(listing);
            setForm(next);
            setBaseline(next);
            setNotice("Your saved property draft has been restored.");
          }
        }
      } catch {
        if (active)
          setError(
            "Could not restore the saved draft. Your server copy is still available in existing listings.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    void restore();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    notify.current?.(dirty || busy || uploading || positioning);
    return () => notify.current?.(false);
  }, [dirty, busy, uploading, positioning]);
  useEffect(() => {
    if (!dirty && !uploading && !positioning && !busy) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, uploading, positioning, busy]);
  async function save(complete = false) {
    if (positioning) return;
    const issues = validateForm(form, complete);
    setErrors(issues);
    setError("");
    if (Object.keys(issues).length) {
      setError("Check the highlighted property fields. Your work is kept.");
      setStep("overview" in issues ? 1 : 0);
      return;
    }
    setBusy(true);
    try {
      const listing = saved
        ? await patchListing(saved.listingId, {
            ...changedListingPatch(form, baseline),
            expectedRevision: saved.revision,
          })
        : await createListing({ ...listingFormToCreateInput(form), workflowStatus: "draft" });
      setSaved(listing);
      const next = listingToForm(listing);
      setForm(next);
      setBaseline(next);
      setNotice("Draft saved on the server. You can close this form and return later.");
      try {
        if (complete) localStorage.removeItem(DRAFT_KEY);
        else localStorage.setItem(DRAFT_KEY, listing.listingId);
      } catch {
        setNotice(
          "Saved on the server. Resume it from Existing listings; browser storage is unavailable.",
        );
      }
      if (complete) onCreated(listing);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed. Your work is kept.");
      setErrors(
        serverFormErrors((e as { details?: { fields?: Record<string, string> } }).details?.fields),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="listing-editor-panel">
      <header>
        <p className="listing-eyebrow">New property</p>
        {saved ? <h3>Continue property draft</h3> : null}
        <p className="listing-hint">
          Start with what you know. Save an incomplete draft at any step.
        </p>
      </header>
      {saved ? (
        <button
          type="button"
          disabled={positioning || busy || uploading}
          onClick={() => {
            if (
              dirty &&
              !window.confirm(
                "Discard unsaved changes and start another property? Your saved draft is kept.",
              )
            )
              return;
            try {
              localStorage.removeItem(DRAFT_KEY);
            } catch {
              /* Server drafts remain available. */
            }
            setSaved(null);
            setForm(createBlankListingForm());
            setBaseline(createBlankListingForm());
            setStep(0);
            setErrors({});
            setError("");
            setNotice("");
          }}
        >
          Start another property
        </button>
      ) : null}
      {loading ? (
        <p>Restoring draft…</p>
      ) : (
        <ListingFormFields
          form={form}
          setForm={setForm}
          step={step}
          onStepChange={setStep}
          errors={errors}
          onBusyChange={setUploading}
          onLocationPendingChange={setPositioning}
          disabled={busy}
        />
      )}
      {error ? (
        <p className="listing-error" role="alert">
          {error}
        </p>
      ) : null}
      {notice && !dirty ? (
        <p className="listing-success" role="status">
          {notice}
        </p>
      ) : null}
      {positioning && (
        <p role="status" className="listing-warning">
          Confirm the property location on the map, or cancel the adjustment, before saving.
        </p>
      )}
      <footer className="listing-editor__footer">
        <span role="status">
          {busy
            ? "Saving…"
            : uploading
              ? "Uploading photos…"
              : dirty
                ? "Unsaved draft changes"
                : saved
                  ? "Draft saved"
                  : "New property"}
        </span>
        <button
          type="button"
          disabled={positioning || loading || busy || uploading || Boolean(saved && !dirty)}
          className={step < 4 ? "listing-primary" : ""}
          onClick={() => void save()}
        >
          Save draft
        </button>
        {step === 4 ? (
          <button
            type="button"
            className="listing-primary"
            disabled={positioning || loading || busy || uploading}
            onClick={() => void save(true)}
          >
            Create property
          </button>
        ) : null}
      </footer>
    </section>
  );
}
