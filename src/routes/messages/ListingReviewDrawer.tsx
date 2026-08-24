import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Drawer from "../../core/components/Drawer";
import { request } from "../../core/api/request";

type ListingReviewStatus =
  | "pending"
  | "superseded"
  | "approved"
  | "changes_requested"
  | "rejected"
  | "withdrawn";

export type ListingReviewMessage = {
  id: string;
  itemType?: "listing_review_request";
  type: "listing.reviewSubmitted";
  createdAt: string;
  updatedAt: string;
  payload: {
    listingId: string;
    draftId: string;
    reviewRequestId: string;
    reviewStatus: ListingReviewStatus;
    submissionNumber: number;
    submittedDraftRevision: number;
    approvalApplied?: boolean;
    nextAction?: "review" | "open_auction_draft" | "published" | "none";
  };
  meta?: {
    title?: string;
    description?: string;
    severity?: "info" | "success" | "warning" | "error";
  };
  reviewRequest?: {
    reviewRequestId?: string;
    status: ListingReviewStatus;
    submittedBy: string;
    submittedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    generalMessage?: string;
    revision?: number;
    fieldIssues?: Array<{ issueId?: string; message: string; fieldPath?: string; severity?: string }>;
    submittedDraftRevision?: number;
    submittedSnapshot?: any;
    adminEditedSnapshot?: any;
    approvedSnapshot?: any;
  };
  listing?: any;
  draft?: any;
  auctionDraft?: any;
};

type ListingSystemEvent = {
  id: string;
  itemType: "system_event";
  type: string;
  createdAt: string;
  updatedAt: string;
  payload: {
    listingId: string;
    auctionDraftId?: string;
    reviewRequestId?: string;
  };
  meta?: {
    title?: string;
    description?: string;
    severity?: "info" | "success" | "warning" | "error";
  };
  auctionDraft?: any;
};

export type ListingReviewConversation = {
  id: string;
  listingId: string;
  listingSummary?: {
    title?: string;
    address?: string;
    thumbnailUrl?: string;
  };
  unreadCount: number;
  messageCount: number;
  lastActivityAt: string;
  latestPreview: string;
  currentReviewRequest?: ListingReviewMessage["reviewRequest"] | null;
  currentWorkflowStatus?: string;
  currentAuctionDraft?: any | null;
  items: Array<ListingReviewMessage | ListingSystemEvent>;
};

function isReviewItem(item: ListingReviewMessage | ListingSystemEvent): item is ListingReviewMessage {
  return item.itemType === "listing_review_request" || item.type === "listing.reviewSubmitted";
}

function displayStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: "var(--dash-muted)" }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value || "-"}</div>
    </div>
  );
}

function Badge({ status }: { status: ListingReviewStatus | string }) {
  const ui =
    status === "pending"
      ? { bg: "rgba(212, 165, 116, 0.18)", fg: "var(--dash-warning)" }
      : status === "approved"
        ? { bg: "rgba(63, 127, 95, 0.14)", fg: "var(--dash-success)" }
        : status === "rejected"
          ? { bg: "rgba(212, 24, 61, 0.1)", fg: "var(--dash-danger)" }
          : status === "changes_requested"
            ? { bg: "rgba(199, 123, 92, 0.16)", fg: "var(--dash-accent)" }
            : { bg: "var(--dash-surface)", fg: "var(--dash-ink-soft)" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        background: ui.bg,
        color: ui.fg,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {displayStatus(status)}
    </span>
  );
}

function prettyLabel(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAny(v: any) {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.length ? v.join(", ") : "-";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function latestReviewStatus(conversation: ListingReviewConversation | null) {
  const review = conversation?.items
    ?.filter(isReviewItem)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
  return (
    conversation?.currentReviewRequest?.status ??
    review?.payload.reviewStatus ??
    conversation?.currentWorkflowStatus ??
    "pending"
  );
}

export default function ListingReviewDrawer({
  open,
  onClose,
  conversation,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  conversation: ListingReviewConversation | null;
  onUpdated?: () => void;
}) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const reviewItems = useMemo(
    () => (conversation?.items ?? []).filter(isReviewItem),
    [conversation],
  );
  const actionable = conversation?.currentReviewRequest ?? null;
  const selectedReview =
    reviewItems.find(
      (item) => item.payload.reviewRequestId === actionable?.reviewRequestId,
    ) ??
    [...reviewItems].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0] ??
    null;
  const status = latestReviewStatus(conversation);
  const listing = selectedReview?.listing ?? {};
  const draft = selectedReview?.draft ?? {};
  const payload =
    actionable?.adminEditedSnapshot ??
    actionable?.submittedSnapshot ??
    selectedReview?.reviewRequest?.adminEditedSnapshot ??
    selectedReview?.reviewRequest?.submittedSnapshot ??
    draft?.data ??
    {};
  const title =
    conversation?.listingSummary?.title ??
    listing?.basicInformation?.title ??
    payload?.basicInformation?.title ??
    "Untitled listing";
  const location =
    listing?.basicInformation?.location ?? payload?.basicInformation?.location ?? {};
  const fieldIssues =
    actionable?.fieldIssues ?? selectedReview?.reviewRequest?.fieldIssues ?? [];
  const auctionDraft = conversation?.currentAuctionDraft ?? selectedReview?.auctionDraft ?? null;

  const payloadEntries = useMemo(
    () =>
      Object.entries({
        title,
        address: location?.address,
        city: location?.city,
        state: location?.state,
        zipcode: location?.zipcode,
        overview: payload?.description?.overview,
        submittedRevision:
          actionable?.submittedDraftRevision ??
          selectedReview?.payload.submittedDraftRevision ??
          selectedReview?.reviewRequest?.submittedDraftRevision,
      }).filter(([, v]) => v !== undefined && v !== ""),
    [actionable, location, payload, selectedReview, title],
  );

  async function runAction(kind: "approve" | "reject" | "request-changes") {
    if (!actionable?.reviewRequestId) return;
    setSaving(true);
    setError(null);

    try {
      const body =
        kind === "approve"
          ? { expectedRevision: actionable.revision }
          : kind === "reject"
            ? { expectedRevision: actionable.revision, reason: note.trim() }
            : { expectedRevision: actionable.revision, generalMessage: note.trim() };

      if (kind !== "approve" && !note.trim()) {
        throw new Error(
          kind === "reject"
            ? "A rejection reason is required."
            : "A change request message is required.",
        );
      }

      await request(`/api/drafts/listings/${actionable.reviewRequestId}/${kind}`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      setNote("");
      onUpdated?.();
    } catch (e: any) {
      setError(e?.message ?? `${kind} failed`);
    } finally {
      setSaving(false);
    }
  }

  const hasActionableReview = actionable?.status === "pending";

  return (
    <Drawer open={open} onClose={onClose} title="Listing Conversation" size={620} zIndex={70}>
      {!conversation ? (
        <div style={{ color: "var(--dash-muted)" }}>No listing conversation selected.</div>
      ) : (
        <div>
          <div style={styles.header}>
            <Badge status={status} />
            <div style={{ fontSize: 12, color: "var(--dash-muted)" }}>
              {hasActionableReview
                ? "Awaiting admin decision"
                : auctionDraft
                  ? "Auction draft ready"
                  : "No active review controls"}
            </div>
          </div>

          {error ? <div style={{ color: "var(--dash-danger)", marginBottom: 12 }}>{error}</div> : null}

          <Detail label="Listing" value={title} />
          <Detail label="Listing ID" value={conversation.listingId} />
          <Detail label="Address" value={conversation.listingSummary?.address} />
          <Detail label="Messages" value={`${conversation.messageCount}`} />

          {selectedReview ? (
            <>
              <Detail label="Current review" value={`Submission #${selectedReview.payload.submissionNumber}`} />
              <Detail
                label="Submitted"
                value={
                  selectedReview.reviewRequest?.submittedAt
                    ? new Date(selectedReview.reviewRequest.submittedAt).toLocaleString()
                    : new Date(selectedReview.createdAt).toLocaleString()
                }
              />
            </>
          ) : null}

          {selectedReview?.reviewRequest?.generalMessage ? (
            <Detail label="Review note" value={selectedReview.reviewRequest.generalMessage} />
          ) : null}

          {payloadEntries.length ? (
            <div style={{ marginTop: 16 }}>
              <div style={styles.sectionTitle}>Submitted snapshot</div>
              <div style={styles.detailGrid}>
                {payloadEntries.map(([k, v], idx) => (
                  <div
                    key={k}
                    style={{
                      ...styles.detailRow,
                      borderTop: idx === 0 ? "none" : "1px solid var(--dash-surface)",
                    }}
                  >
                    <div style={styles.detailKey}>{prettyLabel(k)}</div>
                    <div style={styles.detailValue}>{formatAny(v)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {fieldIssues.length ? (
            <div style={{ marginTop: 16 }}>
              <div style={styles.sectionTitle}>Field issues</div>
              <div style={styles.stack}>
                {fieldIssues.map((issue, idx) => (
                  <div key={issue.issueId ?? idx} style={styles.historyItem}>
                    <div style={styles.primary}>
                      {displayStatus(issue.severity ?? "blocking")}
                      {issue.fieldPath ? ` · ${issue.fieldPath}` : ""}
                    </div>
                    <div style={styles.muted}>{issue.message}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div style={{ marginTop: 16 }}>
            <div style={styles.sectionTitle}>Conversation history</div>
            <div style={styles.stack}>
              {[...(conversation.items ?? [])]
                .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
                .map((item) => {
                  const reviewItem = isReviewItem(item);
                  const itemStatus = reviewItem ? item.payload.reviewStatus : "system";
                  return (
                    <div key={item.id} style={styles.historyItem}>
                      <div style={styles.historyTop}>
                        <span style={styles.primary}>
                          {reviewItem
                            ? `Submission #${item.payload.submissionNumber}`
                            : item.meta?.title ?? "System event"}
                        </span>
                        <span style={styles.muted}>{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                      <div style={styles.muted}>
                        {reviewItem ? displayStatus(itemStatus) : item.meta?.description}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {hasActionableReview ? (
            <div style={{ marginTop: 16 }}>
              <div style={styles.sectionTitle}>Decision note</div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                style={styles.textarea}
              />
            </div>
          ) : null}

          <div style={styles.actions}>
            {hasActionableReview ? (
              <>
                <button onClick={() => runAction("reject")} disabled={saving} style={buttonStyle("ghost", saving)}>
                  Reject
                </button>
                <button
                  onClick={() => runAction("request-changes")}
                  disabled={saving}
                  style={buttonStyle("ghost", saving)}
                >
                  Request changes
                </button>
                <button onClick={() => runAction("approve")} disabled={saving} style={buttonStyle("solid", saving)}>
                  Approve
                </button>
              </>
            ) : null}

            {!hasActionableReview && auctionDraft ? (
              <button
                onClick={() =>
                  auctionDraft.auctionId
                    ? navigate(`/auctions/${auctionDraft.auctionId}`)
                    : navigate(`/auctions/${auctionDraft.id}/edit`)
                }
                style={buttonStyle("solid", false)}
              >
                {auctionDraft.auctionId ? "Open Auction" : "Open Auction Draft"}
              </button>
            ) : null}
          </div>

          {saving ? <div style={{ marginTop: 10, color: "var(--dash-muted)" }}>Saving...</div> : null}
        </div>
      )}
    </Drawer>
  );
}

function buttonStyle(variant: "solid" | "ghost", saving: boolean): React.CSSProperties {
  return {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--dash-border)",
    background: variant === "solid" ? "var(--dash-ink)" : "var(--dash-card)",
    color: variant === "solid" ? "var(--dash-card)" : "var(--dash-ink)",
    cursor: saving ? "not-allowed" : "pointer",
    opacity: saving ? 0.6 : 1,
  };
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 12, color: "var(--dash-muted)", marginBottom: 8 },
  detailGrid: { border: "1px solid var(--dash-border)", borderRadius: 12, overflow: "hidden" },
  detailRow: {
    display: "grid",
    gridTemplateColumns: "160px 1fr",
    gap: 10,
    padding: "10px 12px",
    background: "var(--dash-card)",
  },
  detailKey: { fontSize: 12, color: "var(--dash-muted)" },
  detailValue: { fontSize: 13, color: "var(--dash-ink)", fontWeight: 600 },
  stack: { display: "grid", gap: 8 },
  historyItem: {
    border: "1px solid var(--dash-border)",
    borderRadius: 10,
    padding: 10,
    background: "var(--dash-card)",
  },
  historyTop: { display: "flex", justifyContent: "space-between", gap: 10 },
  primary: { fontSize: 13, color: "var(--dash-ink)", fontWeight: 700 },
  muted: { fontSize: 12, color: "var(--dash-muted)" },
  textarea: {
    width: "100%",
    border: "1px solid var(--dash-border)",
    borderRadius: 10,
    padding: 10,
    resize: "vertical",
  },
  actions: { display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" },
};
