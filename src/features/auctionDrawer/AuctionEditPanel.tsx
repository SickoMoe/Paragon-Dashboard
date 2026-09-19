// components/auctionDrawer/AuctionEditPanel.tsx
import React from "react";
import type { AuctionOverview } from "../auctions/types";
import type { AuctionDraftReadiness } from "../auctions/services/auctionDashboardApi";
import { inputStyle } from "./styles";

type Props = {
  row: AuctionOverview;
  startingBid: string;
  setStartingBid: (v: string) => void;

  increment: string;
  setIncrement: (v: string) => void;

  startDate: string;
  setStartDate: (v: string) => void;

  endDate: string;
  setEndDate: (v: string) => void;

  isPrivate: boolean;
  setIsPrivate: (v: boolean) => void;
  authorizedAccountIds: string;
  setAuthorizedAccountIds: (v: string) => void;

  readiness: AuctionDraftReadiness | null;
  readinessLoading: boolean;
  readinessError: string | null;
  loading: boolean;
  saveSucceeded: boolean;
  error?: string | null;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onCancel: () => void;
  onOpenConversation: () => void;
  onOpenBids: () => void;
};

export function AuctionEditPanel({
  row,
  startingBid,
  setStartingBid,
  increment,
  setIncrement,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isPrivate,
  setIsPrivate,
  authorizedAccountIds,
  setAuthorizedAccountIds,
  readiness,
  readinessLoading,
  readinessError,
  loading,
  saveSucceeded,
  error,
  hasUnsavedChanges,
  onSave,
  onCancel,
  onOpenConversation,
  onOpenBids,
}: Props) {
  const auction = row.auction;
  const listing = row.listing;
  const title = listing?.basicInformation?.title ?? "Untitled listing";
  const location = formatLocation(listing?.basicInformation?.location);
  const missingCount = readiness ? readiness.missingFields.length + readiness.validationErrors.length : 0;

  return (
    <div style={styles.wrap}>
      <section style={styles.hero}>
        <div>
          <div style={styles.kicker}>{row.auctionDraft ? "Auction draft" : "Auction configuration"}</div>
          <h3 style={styles.title}>{title}</h3>
          <div style={styles.muted}>{location}</div>
        </div>
        <StatusPill value={auction.status} />
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionTitle}>Auction Configuration</div>
            <div style={styles.muted}>Only auction setup fields are saved here.</div>
          </div>
          {hasUnsavedChanges ? <span style={styles.unsaved}>Unsaved</span> : null}
        </div>

        <div style={styles.fieldGrid}>
          <Field label="Starting bid">
            <input
              inputMode="numeric"
              value={startingBid}
              onChange={(e) => setStartingBid(e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="Bid increment">
            <input inputMode="numeric" value={increment} onChange={(e) => setIncrement(e.target.value)} style={inputStyle} />
          </Field>

          <Field label="Start date">
            <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
          </Field>

          <Field label="End date">
            <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
          </Field>
        </div>

        <div style={styles.toggleRow}>
          <div>
            <div style={styles.toggleTitle}>Private auction</div>
            <div style={styles.muted}>Hidden from public live summaries until enabled.</div>
          </div>
          <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
        </div>

        {isPrivate ? (
          <Field label="Authorized account IDs">
            <textarea
              value={authorizedAccountIds}
              onChange={(event) => setAuthorizedAccountIds(event.target.value)}
              placeholder="One account ID per line"
              style={{ ...inputStyle, minHeight: 76, resize: "vertical" }}
            />
          </Field>
        ) : null}

        {error ? <div style={styles.error}>{error}</div> : null}

        <div style={styles.actionRow}>
          {saveSucceeded ? <span style={styles.savedText}>Saved</span> : null}
          <button type="button" style={secondaryBtn} onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="button" style={primaryBtn} onClick={onSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionTitle}>Setup Readiness</div>
            <div style={styles.muted}>{readinessLoading ? "Checking readiness..." : "Server validation"}</div>
          </div>
          {readiness ? (
            <span style={readiness.ready ? styles.readyPill : styles.blockedPill}>
              {readiness.ready ? "Ready" : `${missingCount} blockers`}
            </span>
          ) : null}
        </div>

        {readinessError ? <div style={styles.error}>{readinessError}</div> : null}
        {!row.auctionDraft ? (
          <div style={styles.muted}>Readiness is available for auction drafts.</div>
        ) : readiness && readiness.ready ? (
          <div style={styles.readyBox}>This draft has the required setup to move forward.</div>
        ) : readiness ? (
          <div style={styles.blockerList}>
            {readiness.missingFields.map((field) => (
              <div key={`missing-${field}`} style={styles.blockerItem}>
                <strong>{formatField(field)}</strong>
                <span>Required field is missing.</span>
              </div>
            ))}
            {readiness.validationErrors.map((item) => (
              <div key={`${item.field}-${item.message}`} style={styles.blockerItem}>
                <strong>{formatField(item.field)}</strong>
                <span>{item.message}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section style={styles.section}>
        <div style={styles.sectionTitle}>Quick Access</div>
        <div style={styles.quickGrid}>
          <button type="button" style={secondaryBtn} onClick={onOpenConversation}>
            Conversation
          </button>
          <button type="button" style={secondaryBtn} onClick={onOpenBids}>
            Bids
          </button>
          <button
            type="button"
            style={secondaryBtn}
            onClick={() => document.getElementById("auction-activity-log")?.scrollIntoView({ behavior: "smooth" })}
          >
            Activity Log
          </button>
        </div>
      </section>

      <details style={styles.details}>
        <summary style={styles.summary}>Advanced Settings</summary>
        <div style={styles.metaGrid}>
          <Meta label="Auction ID" value={auction.id} />
          <Meta label="Listing ID" value={auction.listingId} />
          <Meta label="Draft ID" value={row.auctionDraft?.id} />
          <Meta label="Approved review" value={row.auctionDraft?.payload?.approvedReviewRequestId} />
          <Meta label="Approved revision" value={formatOptional(row.auctionDraft?.payload?.approvedDraftRevision)} />
        </div>
      </details>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function Meta({ label, value }: { label: string; value?: string }) {
  return (
    <div style={styles.metaItem}>
      <div style={styles.metaLabel}>{label}</div>
      <div style={styles.metaValue}>{value || "-"}</div>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  return <span style={styles.statusPill}>{formatStatus(value)}</span>;
}

function formatLocation(loc?: { address?: string; city?: string; state?: string; zipcode?: string }) {
  if (!loc) return "-";
  const parts = [loc.address, loc.city, loc.state, loc.zipcode].filter(Boolean);
  return parts.length ? parts.join(", ") : "-";
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

function formatField(value: string) {
  return value.replace(/^rules\./, "").replace(/([A-Z])/g, " $1").replace(/\./g, " ");
}

function formatOptional(value?: number) {
  return value == null ? undefined : String(value);
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    paddingBottom: 4,
  },
  kicker: {
    fontSize: 12,
    color: "var(--dash-muted)",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  title: {
    margin: "3px 0",
    fontFamily: "var(--dash-font-display)",
    fontSize: 24,
    fontWeight: 600,
    lineHeight: 1.15,
    letterSpacing: 0,
    color: "var(--dash-ink)",
  },
  section: {
    border: "1px solid var(--dash-border)",
    borderRadius: 8,
    padding: 14,
    background: "var(--dash-card)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "var(--dash-ink)",
  },
  muted: {
    color: "var(--dash-muted)",
    fontSize: 12,
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--dash-muted)",
  },
  toggleRow: {
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderTop: "1px solid var(--dash-surface)",
    paddingTop: 12,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--dash-ink)",
  },
  actionRow: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  unsaved: {
    border: "1px solid rgba(212, 165, 116, 0.34)",
    background: "rgba(212, 165, 116, 0.12)",
    color: "var(--dash-warning)",
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 12,
    fontWeight: 700,
  },
  savedText: {
    marginRight: 4,
    fontSize: 13,
    fontWeight: 700,
    color: "var(--dash-success)",
  },
  readyPill: {
    border: "1px solid rgba(63, 127, 95, 0.28)",
    background: "rgba(63, 127, 95, 0.12)",
    color: "var(--dash-success)",
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 12,
    fontWeight: 800,
  },
  blockedPill: {
    border: "1px solid rgba(212, 165, 116, 0.3)",
    background: "rgba(212, 165, 116, 0.12)",
    color: "var(--dash-accent)",
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 12,
    fontWeight: 800,
  },
  readyBox: {
    border: "1px solid rgba(63, 127, 95, 0.28)",
    background: "rgba(63, 127, 95, 0.12)",
    borderRadius: 8,
    padding: 10,
    color: "var(--dash-success)",
    fontSize: 13,
    fontWeight: 700,
  },
  blockerList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  blockerItem: {
    display: "grid",
    gridTemplateColumns: "150px 1fr",
    gap: 10,
    border: "1px solid rgba(212, 165, 116, 0.3)",
    background: "rgba(212, 165, 116, 0.12)",
    borderRadius: 8,
    padding: "9px 10px",
    fontSize: 12,
    color: "var(--dash-accent)",
  },
  quickGrid: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },
  details: {
    border: "1px solid var(--dash-border)",
    borderRadius: 8,
    padding: 12,
    background: "var(--dash-card)",
  },
  summary: {
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 800,
    color: "var(--dash-ink)",
  },
  metaGrid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  metaItem: {
    border: "1px solid var(--dash-surface)",
    borderRadius: 8,
    padding: "8px 10px",
    minWidth: 0,
  },
  metaLabel: {
    fontSize: 11,
    color: "var(--dash-muted)",
  },
  metaValue: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: 700,
    overflowWrap: "anywhere",
  },
  statusPill: {
    border: "1px solid var(--dash-border)",
    borderRadius: 999,
    padding: "5px 9px",
    background: "var(--dash-surface)",
    color: "var(--dash-ink)",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "capitalize",
    whiteSpace: "nowrap",
  },
  error: {
    marginTop: 10,
    border: "1px solid rgba(212, 24, 61, 0.28)",
    background: "rgba(212, 24, 61, 0.08)",
    borderRadius: 8,
    padding: 10,
    color: "var(--dash-danger)",
    fontSize: 13,
    fontWeight: 700,
  },
};

const primaryBtn: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid var(--dash-primary)",
  background: "var(--dash-primary)",
  color: "var(--dash-primary-fg)",
  fontSize: 13,
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid var(--dash-border)",
  background: "var(--dash-card)",
  color: "var(--dash-ink)",
  fontSize: 13,
  cursor: "pointer",
};
