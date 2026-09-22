import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { IListing } from "../../interfaces/IListing";
import { patchListing, publishListing } from "../listingApi";
import { primaryBtn, secondaryBtn } from "../auctionDrawer/styles";
import {
  ListingFormFields,
  listingFormToPatch,
  listingToForm,
  type ListingFormState,
} from "./ListingFormFields";

export function ListingEditorSection({
  listing,
  onUpdated,
  allowPublish = true,
  onDirtyChange,
}: {
  allowPublish?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  listing: IListing;
  onUpdated: (listing: IListing) => void;
}) {
  const initialForm = useMemo(() => listingToForm(listing), [listing]);
  const [form, setForm] = useState<ListingFormState>(initialForm);
  const [saving, setSaving] = useState<"save" | "publish" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  useEffect(() => { onDirtyChange?.(dirty); return () => onDirtyChange?.(false); }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;

    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = async (shouldPublish: boolean) => {
    setSaving(shouldPublish ? "publish" : "save");
    setError(null);
    setMessage(null);

    try {
      const updated = await patchListing(
        listing.listingId,
        listingFormToPatch(form),
      );
      const saved = shouldPublish
        ? await publishListing(updated.listingId)
        : updated;
      onUpdated(saved);
      setForm(listingToForm(saved));
      setMessage(
        shouldPublish
          ? "Listing saved and published."
          : "Listing changes saved.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save listing.",
      );
    } finally {
      setSaving(null);
    }
  };

  return (
    <section style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <div style={styles.kicker}>Listing management</div>
          <h3 style={styles.title}>Edit listing content</h3>
          <p style={styles.muted}>
            Update public property details, media, contacts, and map coordinates.
          </p>
        </div>
        <div style={styles.statuses}>
          <Status value={listing.moderationStatus ?? "pending"} />
          <Status value={listing.workflowStatus ?? "draft"} />
        </div>
      </div>

      <ListingFormFields form={form} setForm={setForm} />

      {error ? <div style={styles.error}>{error}</div> : null}
      {message ? <div style={styles.success}>{message}</div> : null}

      <div style={styles.actions}>
        {dirty ? <span style={styles.unsaved}>Unsaved listing changes</span> : null}
        <button
          type="button"
          style={secondaryBtn}
          onClick={() => {
            setForm(initialForm);
            setError(null);
            setMessage(null);
          }}
          disabled={!dirty || Boolean(saving)}
        >
          Reset
        </button>
        <button
          type="button"
          style={secondaryBtn}
          onClick={() => void save(false)}
          disabled={!dirty || Boolean(saving)}
        >
          {saving === "save" ? "Saving..." : "Save Listing"}
        </button>
        {allowPublish ? <button
          type="button"
          style={primaryBtn}
          onClick={() => void save(true)}
          disabled={Boolean(saving)}
        >
          {saving === "publish"
            ? "Publishing..."
            : listing.workflowStatus === "published"
              ? "Publish Updates"
              : "Save & Publish"}
        </button> : null}
      </div>
    </section>
  );
}

function Status({ value }: { value: string }) {
  return <span style={styles.status}>{value.replace(/_/g, " ")}</span>;
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    marginTop: 12,
    border: "1px solid var(--dash-border)",
    borderRadius: 8,
    padding: 18,
    background: "var(--dash-card)",
  },
  header: {
    marginBottom: 22,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 18,
  },
  kicker: {
    color: "var(--dash-muted)",
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
  },
  title: {
    margin: "4px 0 5px",
    color: "var(--dash-ink)",
    fontFamily: "var(--dash-font-display)",
    fontSize: 24,
    fontWeight: 600,
    letterSpacing: 0,
  },
  muted: {
    margin: 0,
    color: "var(--dash-muted)",
    fontSize: 12,
  },
  statuses: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 6,
  },
  status: {
    border: "1px solid var(--dash-border)",
    borderRadius: 999,
    padding: "5px 9px",
    background: "var(--dash-surface)",
    color: "var(--dash-muted)",
    fontSize: 11,
    fontWeight: 750,
    textTransform: "capitalize",
  },
  actions: {
    position: "sticky",
    bottom: 0,
    zIndex: 2,
    margin: "24px -18px -18px",
    padding: 14,
    borderTop: "1px solid var(--dash-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 8,
    background: "color-mix(in srgb, var(--dash-card) 94%, transparent)",
    backdropFilter: "blur(12px)",
  },
  unsaved: {
    marginRight: "auto",
    color: "var(--dash-warning)",
    fontSize: 12,
    fontWeight: 700,
  },
  error: {
    marginTop: 14,
    padding: 10,
    borderRadius: 6,
    background: "rgba(178, 67, 67, 0.1)",
    color: "var(--dash-danger)",
    fontSize: 12,
    fontWeight: 700,
  },
  success: {
    marginTop: 14,
    padding: 10,
    borderRadius: 6,
    background: "rgba(63, 127, 95, 0.1)",
    color: "var(--dash-success)",
    fontSize: 12,
    fontWeight: 700,
  },
};
