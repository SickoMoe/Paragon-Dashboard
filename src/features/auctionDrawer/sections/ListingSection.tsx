// src/routes/dashboard/components/auctionDrawer/sections/ListingSection.tsx
import React, { useMemo, useState } from "react";
import { inputStyle, primaryBtn, secondaryBtn } from "../styles";
import { AuctionOverview } from "../../auctions/types";

type Props = {
  row: AuctionOverview;
  listingLoading: boolean;
  loading: boolean;

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

  handleSaveListing: () => void;
};

export function ListingSection(props: Props) {
  const {
    row,
    listingLoading,
    loading,
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
    handleSaveListing,
  } = props;

  const [editing, setEditing] = useState(false);

  const listing = row.listing;

  const locationLine = useMemo(() => {
    const loc = listing?.basicInformation?.location;
    if (!loc) return "—";
    const parts = [loc.address, loc.city, loc.state, loc.zipcode].filter(Boolean);
    return parts.length ? parts.join(", ") : "—";
  }, [listing]);

  const imageCount = listing?.media?.images?.length ?? 0;

  return (
    <section style={styles.section}>
      <div style={styles.headerRow}>
        <h4 style={{ margin: 0 }}>Listing</h4>

        {listing ? (
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            style={secondaryBtnSmall}
          >
            {editing ? "Close" : "Edit"}
          </button>
        ) : null}
      </div>

      {listingLoading ? (
        <p style={styles.muted}>Loading listing…</p>
      ) : !listing ? (
        <p style={styles.muted}>No listing loaded.</p>
      ) : (
        <>
          {/* Compact summary (default view) */}
          {!editing ? (
            <div style={styles.summaryCard}>
              <div style={styles.summaryTitle}>
                {listing.basicInformation?.title ?? "Untitled listing"}
              </div>

              <div style={styles.muted}>{locationLine}</div>

              <div style={styles.metaRow}>
                <MetaPill label="Type" value={listing.basicInformation?.type ?? "—"} />
                <MetaPill label="Images" value={String(imageCount)} />
              </div>

              {/* Quick actions */}
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <button
                  type="button"
                  style={secondaryBtnSmall}
                  onClick={() => setEditing(true)}
                >
                  Edit listing
                </button>

                {/* Optional: open image in new tab */}
                {listing.media?.images?.[0] ? (
                  <a
                    href={listing.media.images[0]}
                    target="_blank"
                    rel="noreferrer"
                    style={linkBtn}
                  >
                    Open image
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            /* Full editor (toggle) */
            <>
              <div style={{ marginTop: 10 }}>
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
                  <input
                    value={primaryImage}
                    onChange={(e) => setPrimaryImage(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Address</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
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

                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button onClick={handleSaveListing} disabled={loading} style={primaryBtn}>
                    {loading ? "Saving…" : "Save Listing"}
                  </button>
            
                </div>
              </div>
            </>
          )}
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
    borderTop: "1px solid #e5e7eb",
    paddingTop: 12,
    marginTop: 12,
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  muted: { fontSize: 13, color: "#6b7280" },

  summaryCard: {
    border: "1px solid #eef0f4",
    borderRadius: 12,
    padding: 12,
    background: "#fff",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 4,
  },
  metaRow: {
    marginTop: 10,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  field: { marginBottom: 8 },
  label: { fontSize: 13, display: "block", marginBottom: 4 },
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