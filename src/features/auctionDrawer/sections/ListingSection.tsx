// src/routes/dashboard/components/auctionDrawer/sections/ListingSection.tsx
import React, { useMemo, useState } from "react";
import { AuctionOverview } from "../../auctions/types";
import type { ListingDraftPayload } from "../../auctions/types";
import { resolveListingMediaUrl } from "../../auctions/utils/listingMedia";
import type { IListing } from "../../../interfaces/IListing";

type Props = {
  row: AuctionOverview;
  listingLoading: boolean;
  onOpenConversation?: () => void;
};

type DiffRow = {
  label: string;
  current: string;
  submitted: string;
  changed: boolean;
};

type ReviewRequest = NonNullable<NonNullable<AuctionOverview["listingReview"]>["request"]>;

export function ListingSection({ row, listingLoading, onOpenConversation }: Props) {
  const [showAllSubmitted, setShowAllSubmitted] = useState(false);
  const [showAllAdmin, setShowAllAdmin] = useState(false);

  const listing = row.listing;
  const review = row.listingReview;
  const request = review?.request;
  const submittedSnapshot = request?.submittedSnapshot ?? request?.data;
  const adminEditedSnapshot = request?.adminEditedSnapshot;
  const approvedSnapshot = request?.approvedSnapshot ?? review?.approvedSnapshot;
  const workingDraft = review?.workingDraft;
  const title = approvedSnapshot?.basicInformation?.title ?? listing?.basicInformation?.title ?? "Untitled listing";
  const locationLine = formatLocation(
    approvedSnapshot?.basicInformation?.location ?? listing?.basicInformation?.location,
  );
  const thumbnail = resolveListingMediaUrl(
    getMediaThumbnail(approvedSnapshot?.media ?? submittedSnapshot?.media ?? listing?.media),
  );
  const imageCount = approvedSnapshot?.media?.images?.length ?? submittedSnapshot?.media?.images?.length ?? listing?.media?.images?.length ?? 0;
  const reviewStatus = request?.status ?? review?.status ?? listing?.moderationStatus ?? "-";
  const submittedDiffRows = useMemo(() => buildDraftRows(listing, submittedSnapshot), [listing, submittedSnapshot]);
  const adminDiffRows = useMemo(
    () => buildPayloadRows(submittedSnapshot, adminEditedSnapshot),
    [submittedSnapshot, adminEditedSnapshot],
  );
  const history = useMemo(() => buildReviewHistory(request, review?.history), [request, review?.history]);
  const auditTrail = row.auction.lifecycle?.auditTrail ?? [];

  if (listingLoading) {
    return <p style={styles.muted}>Loading listing...</p>;
  }

  if (!listing) {
    return <p style={styles.muted}>No listing loaded.</p>;
  }

  return (
    <section style={styles.wrap}>
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionTitle}>Approved Listing</div>
            <div style={styles.muted}>Read-only listing context for this auction.</div>
          </div>
          {onOpenConversation ? (
            <button type="button" style={secondaryBtnSmall} onClick={onOpenConversation}>
              Conversation
            </button>
          ) : null}
        </div>

        <div style={styles.listingSummary}>
          <div style={styles.thumbWrap}>
            {thumbnail ? <img src={thumbnail} alt="" style={styles.thumbImg} /> : <div style={styles.thumbFallback} />}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={styles.listingTitle}>{title}</div>
            <div style={styles.muted}>{locationLine}</div>
            <div style={styles.muted}>{imageCount} images</div>
          </div>
        </div>

        <div style={styles.metaGrid}>
          <MetaPill label="Listing ID" value={shortId(listing.listingId)} />
          <MetaPill label="Review status" value={formatStatus(reviewStatus)} />
          <MetaPill label="Submitted" value={formatDate(request?.submittedAt ?? request?.createdAt)} />
          <MetaPill label="Updated" value={formatDate(request?.updatedAt)} />
          <MetaPill label="Review request" value={shortId(request?.reviewRequestId ?? request?.draftId)} />
          <MetaPill label="Submission" value={request?.submissionNumber ? `#${request.submissionNumber}` : "-"} />
          <MetaPill label="Revision" value={request?.revision ? String(request.revision) : "-"} />
          <MetaPill label="Owner" value={shortId(review?.ownerAccountId ?? listing.ownerAccountId)} />
        </div>
      </section>

      <DiffSection
        title="Submitted Changes"
        currentLabel="Current listing"
        submittedLabel="Submitted version"
        rows={submittedDiffRows}
        showAll={showAllSubmitted}
        onToggleShowAll={() => setShowAllSubmitted((value) => !value)}
      />

      {adminEditedSnapshot ? (
        <DiffSection
          title="Admin-edited Review Version"
          currentLabel="Original submission"
          submittedLabel="Admin review version"
          rows={adminDiffRows}
          showAll={showAllAdmin}
          onToggleShowAll={() => setShowAllAdmin((value) => !value)}
        />
      ) : null}

      <section style={styles.section}>
        <div style={styles.sectionTitle}>Listing Version</div>
        <div style={styles.versionGrid}>
          <MetaPill label="Approved snapshot" value={approvedSnapshot ? "Available" : "Not attached"} />
          <MetaPill label="Working draft" value={workingDraft ? `Revision ${workingDraft.revision ?? "-"}` : "None"} />
          <MetaPill label="Working updated" value={formatDate(workingDraft?.updatedAt)} />
          <MetaPill label="Auction listing" value={shortId(row.auction.listingId)} />
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionTitle}>Review History</div>
        {history.length ? (
          <div style={styles.timeline}>
            {history.map((item) => (
              <div key={itemKey(item)} style={styles.timelineItem}>
                <div style={styles.timelineTop}>
                  <strong>{historyTitle(item)}</strong>
                  <span style={styles.muted}>{formatDate(item.updatedAt ?? item.submittedAt ?? item.createdAt)}</span>
                </div>
                <div style={styles.muted}>
                  {formatStatus(item.status ?? "-")}
                  {item.generalMessage || item.reviewReason ? `: ${item.generalMessage ?? item.reviewReason}` : ""}
                </div>
                {item.fieldIssues?.length ? (
                  <div style={styles.issueList}>
                    {item.fieldIssues.map((issue) => (
                      <span key={issue.issueId} style={issue.severity === "blocking" ? styles.blockingIssue : styles.advisoryIssue}>
                        {issue.fieldPath ? `${issue.fieldPath}: ` : ""}
                        {issue.message}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.muted}>No review history is attached.</p>
        )}
      </section>

      <section id="auction-activity-log" style={styles.section}>
        <div style={styles.sectionTitle}>Activity Log</div>
        {auditTrail.length ? (
          <div style={styles.timeline}>
            {auditTrail.slice().reverse().map((event, index) => (
              <div key={`${event.action}-${event.at}-${index}`} style={styles.timelineItem}>
                <div style={styles.timelineTop}>
                  <strong>{formatStatus(event.action)}</strong>
                  <span style={styles.muted}>{formatDate(event.at)}</span>
                </div>
                <div style={styles.muted}>
                  {[event.fromStatus, event.toStatus].filter(Boolean).map(formatStatus).join(" -> ") || event.reason || "-"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.muted}>No auction activity is attached.</p>
        )}
      </section>
    </section>
  );
}

function DiffSection({
  title,
  currentLabel,
  submittedLabel,
  rows,
  showAll,
  onToggleShowAll,
}: {
  title: string;
  currentLabel: string;
  submittedLabel: string;
  rows: DiffRow[];
  showAll: boolean;
  onToggleShowAll: () => void;
}) {
  const changedRows = rows.filter((row) => row.changed);
  const visibleRows = showAll ? rows : changedRows;

  return (
    <section style={styles.section}>
      <div style={styles.sectionHeader}>
        <div>
          <div style={styles.sectionTitle}>{title}</div>
          <div style={styles.muted}>{changedRows.length} changed</div>
        </div>
        {rows.length > changedRows.length ? (
          <button type="button" style={secondaryBtnSmall} onClick={onToggleShowAll}>
            {showAll ? "Changed Only" : "Expand All"}
          </button>
        ) : null}
      </div>

      {!rows.length ? (
        <p style={styles.muted}>No submitted payload is attached.</p>
      ) : !changedRows.length ? (
        <div style={styles.emptyState}>No changes detected.</div>
      ) : (
        <div style={styles.diffTable}>
          <div style={{ ...styles.diffRow, ...styles.diffHead }}>
            <div>Field</div>
            <div>{currentLabel}</div>
            <div>{submittedLabel}</div>
          </div>
          {visibleRows.map((row) => (
            <div key={row.label} style={styles.diffRow}>
              <div style={row.changed ? styles.changedLabel : undefined}>{row.label}</div>
              <div style={styles.diffValue}>{row.current}</div>
              <div style={row.changed ? styles.submittedChangedValue : styles.diffValue}>{row.submitted}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MetaPill({ label, value }: { label: string; value?: string }) {
  return (
    <div style={styles.metaPill}>
      <div style={styles.metaLabel}>{label}</div>
      <div style={styles.metaValue}>{value || "-"}</div>
    </div>
  );
}

function buildReviewHistory(
  request?: ReviewRequest | null,
  history?: Array<ReviewRequest>,
): ReviewRequest[] {
  const items = [...(history ?? [])];
  if (request && !items.some((item) => itemKey(item) === itemKey(request))) {
    items.unshift(request);
  }

  return items.sort((a, b) => {
    const aTime = Date.parse(a.updatedAt ?? a.submittedAt ?? a.createdAt ?? "");
    const bTime = Date.parse(b.updatedAt ?? b.submittedAt ?? b.createdAt ?? "");
    return bTime - aTime;
  });
}

function historyTitle(item: ReviewRequest) {
  if (item.submissionNumber) return `Submission #${item.submissionNumber}`;
  return item.reviewRequestId ? "Review request" : "Submitted draft";
}

function itemKey(item: ReviewRequest) {
  return item.reviewRequestId ?? item.draftId ?? `${item.submittedAt ?? item.createdAt}-${item.revision ?? ""}`;
}

function buildDraftRows(listing?: IListing | null, draft?: ListingDraftPayload): DiffRow[] {
  if (!listing || !draft) return [];

  const loc = listing.basicInformation.location;
  const draftLoc = draft.basicInformation.location;

  const rows: Array<[string, unknown, unknown]> = [
    ["Title", listing.basicInformation.title, draft.basicInformation.title],
    ["Type", listing.basicInformation.type, draft.basicInformation.type],
    ["Thumbnail", getMediaThumbnail(listing.media), getMediaThumbnail(draft.media)],
    ["Address", loc.address, draftLoc.address],
    ["City", loc.city, draftLoc.city],
    ["State", loc.state, draftLoc.state],
    ["Zip", loc.zipcode, draftLoc.zipcode],
    ["Overview", listing.description.overview, draft.description.overview],
    ["Details", listing.description.detailedDescription, draft.description.detailedDescription],
    ["Beds", listing.propertyFeatures.bedrooms, draft.propertyFeatures.bedrooms],
    ["Baths", listing.propertyFeatures.bathrooms, draft.propertyFeatures.bathrooms],
    ["Building SQFT", listing.propertyFeatures.buildingSQFT, draft.propertyFeatures.buildingSQFT],
    ["Lot size", listing.propertyFeatures.lotSize, draft.propertyFeatures.lotSize],
    ["Year built", listing.propertyFeatures.yearBuilt, draft.propertyFeatures.yearBuilt],
    ["Amenities", listing.propertyFeatures.amenities, draft.propertyFeatures.amenities],
    ["Title status", listing.legalInformation.titleStatus, draft.legalInformation.titleStatus],
    ["Zoning", listing.legalInformation.zoningInformation, draft.legalInformation.zoningInformation],
    ["Seller", listing.contactInformation.seller.name, draft.contactInformation.seller.name],
    ["Seller contact", listing.contactInformation.seller.contactDetails, draft.contactInformation.seller.contactDetails],
    ["Support contact", listing.contactInformation.biddingSupport.contactDetails, draft.contactInformation.biddingSupport.contactDetails],
    ["Inspection", listing.additionalInformation.inspectionDetails, draft.additionalInformation.inspectionDetails],
    ["Financing", listing.additionalInformation.financingOptions, draft.additionalInformation.financingOptions],
    ["Social sharing", listing.socialSharing, draft.socialSharing],
    ["Terms", listing.termsAndConditions, draft.termsAndConditions],
  ];

  return rows.map(([label, current, submitted]) => {
    const currentValue = formatValue(current);
    const submittedValue = formatValue(submitted);
    return {
      label,
      current: currentValue,
      submitted: submittedValue,
      changed: normalizeValue(current) !== normalizeValue(submitted),
    };
  });
}

function buildPayloadRows(current?: ListingDraftPayload, submitted?: ListingDraftPayload): DiffRow[] {
  if (!current || !submitted) return [];
  return buildDraftRows(current as unknown as IListing, submitted);
}

function getMediaThumbnail(media?: IListing["media"] | ListingDraftPayload["media"]) {
  return media?.thumbnailUrl || media?.images?.[0] || "";
}

function formatValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "-";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function normalizeValue(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).join("|");
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatLocation(loc?: { address?: string; city?: string; state?: string; zipcode?: string }) {
  if (!loc) return "-";
  const parts = [loc.address, loc.city, loc.state, loc.zipcode].filter(Boolean);
  return parts.length ? parts.join(", ") : "-";
}

function formatStatus(value?: string) {
  return value ? value.replace(/_/g, " ") : "-";
}

function shortId(value?: string) {
  if (!value || value === "-") return "-";
  return value.length > 12 ? `${value.slice(0, 8)}...` : value;
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 12,
  },
  section: {
    border: "1px solid var(--dash-border)",
    borderRadius: 8,
    padding: 14,
    background: "var(--dash-card)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "var(--dash-ink)",
  },
  muted: { fontSize: 12, color: "var(--dash-muted)" },
  listingSummary: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  listingTitle: {
    fontSize: 16,
    color: "var(--dash-ink)",
    fontFamily: "var(--dash-font-display)",
    fontWeight: 600,
    letterSpacing: 0,
    overflowWrap: "anywhere",
  },
  thumbWrap: {
    width: 70,
    height: 56,
    borderRadius: 8,
    overflow: "hidden",
    background: "var(--dash-surface)",
    flex: "0 0 auto",
  },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  thumbFallback: { width: "100%", height: "100%", background: "var(--dash-border)" },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 8,
  },
  versionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 8,
    marginTop: 10,
  },
  metaPill: {
    border: "1px solid var(--dash-surface)",
    background: "var(--dash-surface)",
    borderRadius: 8,
    padding: "8px 10px",
    minWidth: 0,
  },
  metaLabel: { fontSize: 11, color: "var(--dash-muted)" },
  metaValue: { fontSize: 12, fontWeight: 800, color: "var(--dash-ink)", marginTop: 2, textTransform: "capitalize", overflowWrap: "anywhere" },
  diffTable: {
    border: "1px solid var(--dash-border)",
    borderRadius: 8,
    overflow: "hidden",
  },
  diffRow: {
    display: "grid",
    gridTemplateColumns: "140px minmax(0, 1fr) minmax(0, 1fr)",
    gap: 10,
    padding: "9px 12px",
    borderBottom: "1px solid var(--dash-surface)",
    fontSize: 12,
    alignItems: "start",
  },
  diffHead: {
    fontWeight: 800,
    color: "var(--dash-muted)",
    background: "var(--dash-surface)",
  },
  diffValue: {
    color: "var(--dash-ink-soft)",
    minWidth: 0,
    overflowWrap: "anywhere",
  },
  changedLabel: {
    color: "var(--dash-ink)",
    fontWeight: 800,
  },
  submittedChangedValue: {
    color: "var(--dash-success)",
    fontWeight: 800,
    minWidth: 0,
    overflowWrap: "anywhere",
  },
  emptyState: {
    border: "1px solid rgba(63, 127, 95, 0.28)",
    background: "rgba(63, 127, 95, 0.12)",
    borderRadius: 8,
    padding: 10,
    color: "var(--dash-success)",
    fontSize: 13,
    fontWeight: 700,
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 10,
  },
  timelineItem: {
    border: "1px solid var(--dash-surface)",
    borderRadius: 8,
    padding: 10,
  },
  timelineTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 4,
    fontSize: 13,
  },
  issueList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  blockingIssue: {
    border: "1px solid rgba(212, 24, 61, 0.28)",
    background: "rgba(212, 24, 61, 0.08)",
    color: "var(--dash-danger)",
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 11,
    fontWeight: 700,
  },
  advisoryIssue: {
    border: "1px solid rgba(199, 123, 92, 0.28)",
    background: "rgba(199, 123, 92, 0.1)",
    color: "var(--dash-accent)",
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 11,
    fontWeight: 700,
  },
};

const secondaryBtnSmall: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--dash-border)",
  background: "var(--dash-card)",
  color: "var(--dash-ink)",
  fontSize: 13,
  cursor: "pointer",
};
