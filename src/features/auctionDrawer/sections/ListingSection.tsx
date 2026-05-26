// src/routes/dashboard/components/auctionDrawer/sections/ListingSection.tsx
import React, { useEffect, useMemo, useState } from "react";
import { inputStyle } from "../styles";
import { AuctionOverview } from "../../auctions/types";
import type { ListingModerationStatus } from "../../listingApi";

type Props = {
  row: AuctionOverview;
  listingLoading: boolean;
  loading: boolean;
  saveSucceeded: boolean;
  moderationStatus: ListingModerationStatus;
  setModerationStatus: React.Dispatch<React.SetStateAction<ListingModerationStatus>>;
  onSave: () => void;
  onCancel: () => void;
  title: string;
  setTitle: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  primaryImage: string;
  setPrimaryImage: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  state: string;
  setState: (v: string) => void;
  zipcode: string;
  setZipcode: (v: string) => void;
};

export function ListingSection(props: Props) {
  const {
    row,
    listingLoading,
    loading,
    saveSucceeded,
    moderationStatus,
    setModerationStatus,
    onSave,
    onCancel,
    title,
    setTitle,
    type,
    setType,
    primaryImage,
    setPrimaryImage,
    address,
    setAddress,
    city,
    setCity,
    state,
    setState,
    zipcode,
    setZipcode,
  } = props;

  const [displayStatus, setDisplayStatus] = useState<ListingModerationStatus | "—">("—");

  const listing = row.listing;

  useEffect(() => {
    setDisplayStatus(moderationStatus);
  }, [moderationStatus]);

  const locationLine = useMemo(() => {
    const loc = listing?.basicInformation?.location;
    if (!loc) return "—";
    const parts = [loc.address, loc.city, loc.state, loc.zipcode].filter(Boolean);
    return parts.length ? parts.join(", ") : "—";
  }, [listing]);

  const imageCount = listing?.media?.images?.length ?? 0;

  function handleListingModeration(status: ListingModerationStatus) {
    if (!listing) return;

    setModerationStatus(status);
    setDisplayStatus(status);
  }

  return (
    <section style={styles.section}>
      {listingLoading ? (
        <p style={styles.muted}>Loading listing…</p>
      ) : !listing ? (
        <p style={styles.muted}>No listing loaded.</p>
      ) : (
        <>
          <div style={styles.editorCard}>
            <div style={styles.editorTitle}>Listing details</div>

            <div style={styles.field}>
              <label style={styles.label}>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Type</label>
              <input value={type} onChange={(e) => setType(e.target.value)} style={inputStyle} />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Primary Image URL</label>
              <div style={styles.inlineFieldRow}>
                <input
                  value={primaryImage}
                  onChange={(e) => setPrimaryImage(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                {listing.media?.images?.[0] ? (
                  <a href={listing.media.images[0]} target="_blank" rel="noreferrer" style={linkBtn}>
                    Open image
                  </a>
                ) : null}
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
            </div>

            <div style={styles.inlineFieldRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ width: 90 }}>
                <label style={styles.label}>State</label>
                <input value={state} onChange={(e) => setState(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ width: 110 }}>
                <label style={styles.label}>Zip</label>
                <input value={zipcode} onChange={(e) => setZipcode(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={styles.moderationCard}>
            <div style={styles.editorTitle}>Moderation</div>

            <div style={styles.metaRow}>
              <MetaPill label="Status" value={displayStatus} />
              <MetaPill label="Images" value={String(imageCount)} />
              <MetaPill label="Location" value={locationLine} />
            </div>

            <div style={styles.actionRow}>
              {displayStatus !== "approved" ? (
                <button
                  type="button"
                  style={secondaryBtnSmall}
                  disabled={loading}
                  onClick={() => handleListingModeration("approved")}
                >
                  {displayStatus === "removed" || displayStatus === "denied" ? "Restore" : "Approve"}
                </button>
              ) : null}

              {displayStatus !== "denied" ? (
                <button
                  type="button"
                  style={secondaryBtnSmall}
                  disabled={loading}
                  onClick={() => handleListingModeration("denied")}
                >
                  Deny
                </button>
              ) : null}

              {displayStatus !== "removed" ? (
                <button
                  type="button"
                  style={secondaryBtnSmall}
                  disabled={loading}
                  onClick={() => handleListingModeration("removed")}
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>

          <div style={styles.footerActions}>
            {saveSucceeded ? <span style={styles.savedText}>✓ Saved</span> : null}
            <button onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button onClick={onSave} disabled={loading}>
              {loading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={pill.wrap}>
      <div style={pill.label}>{label}</div>
      <div style={pill.value}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    marginTop: 12,
  },
  muted: { fontSize: 13, color: "#6b7280" },
  editorCard: {
    border: "1px solid #eef0f4",
    borderRadius: 12,
    padding: 12,
    background: "#fff",
  },
  moderationCard: {
    border: "1px solid #eef0f4",
    borderRadius: 12,
    padding: 12,
    background: "#fff",
    marginTop: 10,
  },
  editorTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 10,
  },
  field: { marginBottom: 10 },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: "#6b7280",
    display: "block",
    marginBottom: 6,
  },
  inlineFieldRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  actionRow: {
    marginTop: 10,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  metaRow: {
    marginTop: 10,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  footerActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTop: "1px solid #eef0f4",
  },
  savedText: {
    alignSelf: "center",
    marginRight: 4,
    fontSize: 13,
    fontWeight: 600,
    color: "#047857",
  },
};

const pill: Record<string, React.CSSProperties> = {
  wrap: {
    border: "1px solid #eef0f4",
    background: "#f9fafb",
    borderRadius: 12,
    padding: "8px 10px",
    minWidth: 110,
  },
  label: { fontSize: 11, color: "#6b7280" },
  value: { fontSize: 13, fontWeight: 700, color: "#111827", marginTop: 2 },
};

const secondaryBtnSmall: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
  fontSize: 13,
  cursor: "pointer",
};

const linkBtn: React.CSSProperties = {
  ...secondaryBtnSmall,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#111827",
};
