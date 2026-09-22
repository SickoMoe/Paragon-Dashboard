import { useEffect, useState } from "react";
import { AuctionOverview } from "../auctions/types";
import { IAuction } from "../../interfaces/IAuction";
import { inputStyle, primaryBtn, secondaryBtn } from "../auctionDrawer/styles";
import { IListing } from "../../interfaces/IListing";
import { ListingEditorSection } from "../listingEditor/ListingEditorSection";
import ListingCreation from "../listingEditor/ListingCreation";
import { fetchManagedListings, type CreateListingInput } from "../listingApi";
let tempCounter = 0;

export function makeTempId() {
  tempCounter += 1;
  return `temp-${tempCounter}`;
}

export function createOptimisticDraft(
  input: {
    listingId: string;
    startingBid?: number;
    rules?: { bidIncrement?: number };
    startDate?: string;
    endDate?: string;
  },
  listing: IListing,
): AuctionOverview {
  const tempId = `draft-${Date.now()}`;

  const auction: IAuction = {
    id: tempId,
    listingId: input.listingId,
    listing,
    startingBid: input.startingBid ?? 0,
    rules: {
      bidIncrement: input.rules?.bidIncrement ?? 1000,
      currency: "USD",
    },
    roles: [],
    bids: [],
    isPrivate: false,
    status: "draft",
    startDate: input.startDate,
    endDate: input.endDate,
    createdBy: "optimistic",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    auction,
    listing,
    bid: {
      openingBid: auction.startingBid ?? 0,
      incrementAmount: auction.rules.bidIncrement,
      currentBid: 0,
      bidCount: 0,
    },
  };
}
const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
};

const modal: React.CSSProperties = {
  background: "var(--dash-card)",
  borderRadius: 12,
  width: "calc(100vw - 32px)",
  boxSizing: "border-box",
  maxWidth: 820,
  maxHeight: "90vh",
  overflowY: "auto",
  padding: 22,
  boxShadow: "var(--dash-shadow-lg)",
};

const header: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 20,
};

const listingModeStyle: React.CSSProperties = {
  padding: 4,
  borderRadius: 7,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 4,
  background: "var(--dash-surface)",
};

const listingModeButton: React.CSSProperties = {
  minHeight: 38,
  border: 0,
  borderRadius: 6,
  background: "transparent",
  color: "var(--dash-muted)",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 750,
};

const listingModeButtonActive: React.CSSProperties = {
  background: "var(--dash-card)",
  color: "var(--dash-ink)",
  boxShadow: "0 1px 4px rgba(18, 18, 20, 0.1)",
};

const closeBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: 24,
  cursor: "pointer",
  lineHeight: 1,
};

export function CreateAuctionModal({
  onClose,
  onSubmit,
  initialMode = "existing",
}: {
  initialMode?: "existing" | "new";
  onClose: () => void;
  onSubmit: (input: CreateAuctionInput) => void | Promise<void>;
}) {
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const close = () => {
    if (
      !loading &&
      (!dirty || window.confirm("Discard unsaved changes? Saved property drafts will be kept."))
    )
      onClose();
  };
  const [error, setError] = useState<string | null>(null);
  async function handleSubmit(input: CreateAuctionInput) {
    setLoading(true);
    setError(null);

    try {
      await onSubmit(input);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create auction");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={overlay}>
      <div
        style={modal}
        role="dialog"
        aria-modal="true"
        aria-label={initialMode === "new" ? "Create property" : "Create auction"}
      >
        <header style={header}>
          <h3 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>
            {initialMode === "new" ? "Create property" : "Create auction"}
          </h3>
          <button onClick={close} disabled={loading} aria-label="Close creation" style={closeBtn}>
            ×
          </button>
        </header>

        {error && <div style={{ color: "var(--dash-danger)" }}>{error}</div>}

        <CreateAuctionForm
          onSubmit={handleSubmit}
          onCancel={close}
          onDirtyChange={setDirty}
          initialMode={initialMode}
          busy={loading}
          onPropertyCreated={initialMode === "new" ? onClose : undefined}
        />

        {loading && <div style={{ marginTop: 12 }}>Creating…</div>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {title ? <h4 style={{ margin: 0 }}>{title}</h4> : null}
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, color: "var(--dash-muted)" }}>{label}</span>
      {children}
    </label>
  );
}

export type CreateAuctionInput = {
  listingId: string;
  listing?: CreateListingInput;
  startingBid: number;
  bidIncrement: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  isPrivate: boolean;
  authorizedAccountIds: string[];
  status: "draft" | "scheduled";
};

export function CreateAuctionForm({
  onSubmit,
  onCancel,
  onDirtyChange,
  onPropertyCreated,
  initialMode = "existing",
  busy = false,
}: {
  onPropertyCreated?: () => void;
  busy?: boolean;
  initialMode?: "existing" | "new";
  onDirtyChange?: (dirty: boolean) => void;
  onSubmit: (data: CreateAuctionInput) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CreateAuctionInput>({
    listingId: "",
    startingBid: 0,
    bidIncrement: 1000,
    currency: "USD",
    isPrivate: false,
    authorizedAccountIds: [],
    status: "draft",
  });
  const [listingMode, setListingMode] = useState<"existing" | "new">(initialMode);
  const [listingDirty, setListingDirty] = useState(false);
  const [editingSelected, setEditingSelected] = useState(false);
  const [auctionDirty, setAuctionDirty] = useState(false);
  const [managedListings, setManagedListings] = useState<IListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchManagedListings()
      .then((items) => {
        if (!active) return;
        setManagedListings(items);
        setForm((current) => ({
          ...current,
          listingId: current.listingId || items[0]?.listingId || "",
        }));
      })
      .catch((cause) => {
        if (!active) return;
        setListingsError(cause instanceof Error ? cause.message : "Unable to load listings");
      })
      .finally(() => {
        if (active) setListingsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    onDirtyChange?.(listingDirty || auctionDirty);
  }, [listingDirty, auctionDirty, onDirtyChange]);

  function update<K extends keyof CreateAuctionInput>(key: K, value: CreateAuctionInput[K]) {
    setAuctionDirty(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canSubmit =
    Boolean(form.listingId) &&
    form.startingBid > 0 &&
    form.bidIncrement > 0 &&
    (!form.startDate || !form.endDate || form.startDate < form.endDate);
  function mode(next: "existing" | "new") {
    if (listingDirty && !window.confirm("Discard unsaved property changes? Saved drafts are kept."))
      return;
    setListingMode(next);
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        maxWidth: 760,
      }}
    >
      {/* Listing */}
      <Section title={initialMode === "new" ? "" : "Listing"}>
        {initialMode !== "new" ? (
          <div style={listingModeStyle}>
            <button
              type="button"
              style={{
                ...listingModeButton,
                ...(listingMode === "existing" ? listingModeButtonActive : {}),
              }}
              onClick={() => mode("existing")}
            >
              Existing listing
            </button>
            <button
              type="button"
              style={{
                ...listingModeButton,
                ...(listingMode === "new" ? listingModeButtonActive : {}),
              }}
              onClick={() => mode("new")}
            >
              Create listing
            </button>
          </div>
        ) : null}

        {listingMode === "existing" ? (
          <>
            <Field label="Property listing">
              <select
                style={inputStyle}
                value={form.listingId}
                disabled={listingsLoading}
                onChange={(event) => {
                  if (!listingDirty || window.confirm("Discard unsaved property changes?")) {
                    setEditingSelected(false);
                    update("listingId", event.target.value);
                  }
                }}
              >
                {managedListings.length ? null : (
                  <option value="">
                    {listingsLoading ? "Loading listings..." : "No listings available"}
                  </option>
                )}
                {managedListings.map((listing) => (
                  <option key={listing.listingId} value={listing.listingId}>
                    {listing.basicInformation.title || "Untitled"} -
                    {listing.workflowStatus ?? "draft"}
                  </option>
                ))}
              </select>
            </Field>
            {form.listingId && !editingSelected ? (
              <button type="button" onClick={() => setEditingSelected(true)}>
                Edit selected property
              </button>
            ) : null}
            {editingSelected &&
            managedListings.find((item) => item.listingId === form.listingId) ? (
              <ListingEditorSection
                key={form.listingId}
                listing={managedListings.find((item) => item.listingId === form.listingId)!}
                onDirtyChange={setListingDirty}
                onUpdated={(listing) =>
                  setManagedListings((items) =>
                    items.map((item) => (item.listingId === listing.listingId ? listing : item)),
                  )
                }
              />
            ) : null}
            {listingsError ? (
              <div style={{ color: "var(--dash-danger)", fontSize: 12 }}>{listingsError}</div>
            ) : null}
          </>
        ) : (
          <ListingCreation
            onDirtyChange={setListingDirty}
            onCreated={(listing) => {
              setManagedListings((items) => [
                listing,
                ...items.filter((item) => item.listingId !== listing.listingId),
              ]);
              setForm((current) => ({ ...current, listingId: listing.listingId }));
              setListingMode("existing");
              setListingDirty(false);
              onPropertyCreated?.();
            }}
          />
        )}
      </Section>
      {listingMode === "existing" ? (
        <>
          {/* Bidding */}
          <Section title="Bidding">
            <Field label="Starting Bid">
              <input
                style={inputStyle}
                type="number"
                min={0}
                value={form.startingBid}
                onChange={(e) => update("startingBid", Number(e.target.value))}
              />
            </Field>

            <Field label="Bid Increment">
              <input
                style={inputStyle}
                type="number"
                min={1}
                value={form.bidIncrement}
                onChange={(e) => update("bidIncrement", Number(e.target.value))}
              />
            </Field>

            <Field label="Currency">
              <select
                style={inputStyle}
                value={form.currency}
                onChange={(e) => update("currency", e.target.value)}
              >
                <option value="USD">USD</option>
              </select>
            </Field>
          </Section>

          {/* Schedule */}
          <Section title="Schedule">
            <Field label="Start Date">
              <input
                style={inputStyle}
                type="datetime-local"
                value={form.startDate ?? ""}
                onChange={(e) => update("startDate", e.target.value)}
              />
            </Field>

            <Field label="End Date">
              <input
                style={inputStyle}
                type="datetime-local"
                value={form.endDate ?? ""}
                onChange={(e) => update("endDate", e.target.value)}
              />
            </Field>
          </Section>

          {/* Visibility */}
          <Section title="Visibility">
            <label style={{ display: "flex", gap: 8 }}>
              <input
                type="checkbox"
                checked={form.isPrivate}
                onChange={(e) => update("isPrivate", e.target.checked)}
              />
              Private auction
            </label>
            {form.isPrivate ? (
              <Field label="Authorized account IDs">
                <textarea
                  style={{ ...inputStyle, minHeight: 76, resize: "vertical" }}
                  value={form.authorizedAccountIds.join("\n")}
                  placeholder="One account ID per line"
                  onChange={(event) =>
                    update(
                      "authorizedAccountIds",
                      event.target.value
                        .split(/[\n,]/)
                        .map((id) => id.trim())
                        .filter(Boolean),
                    )
                  }
                />
              </Field>
            ) : null}
          </Section>

          {/* Status */}
          <Section title="Status">
            <select
              style={inputStyle}
              value={form.status}
              onChange={(e) => update("status", e.target.value as "draft" | "scheduled")}
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </Section>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={onCancel} style={secondaryBtn}>
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSubmit || busy || listingDirty}
              onClick={() => onSubmit(form)}
              style={{
                ...primaryBtn,
                opacity: canSubmit ? 1 : 0.55,
                cursor: canSubmit ? "pointer" : "not-allowed",
              }}
            >
              Create Auction
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
