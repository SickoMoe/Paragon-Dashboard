// src/routes/messages/index.tsx (MessagesPage)
import React, { useEffect, useMemo, useState } from "react";
import { useRouteLoaderData, useRevalidator, useSearchParams } from "react-router-dom";
import { useRegisterDashboardFrame } from "../../core/useRegisterDashboardFrame";
import { MessagesTab, MessagesTabs } from "./components/MessagesTab";
import { MessagesToolbar } from "./components/MessagesToolbar";
import { MessageRow, MessagesTable } from "./components/MessagesTable";
import BidderApplicationDrawer from "./BidderApplicationDrawer";
import ListingReviewDrawer, { ListingReviewConversation } from "./ListingReviewDrawer";
import QuestionDrawer, { type AuctionQuestionConversation } from "./QuestionDrawer";
import type { RootLoaderData } from "../../loader";

type BidderApplicationStatus = "pending" | "approved" | "rejected" | "suspended";

export type BidderApplicationRow = {
  accountId: string;
  applicationId: string;
  status: BidderApplicationStatus;
  bidderStatus: "none" | "pending" | "approved" | "rejected" | "suspended";
  createdAt: string;
  updatedAt: string;
  user?: { username?: string; email?: string; phone?: string };
  payload?: Record<string, any>;
  decisionNote?: string;
};

type RowMeta = {
  kind: "application" | "listing_conversation" | "auction_question";
  status?: string;
};

type StatusFilter =
  | "all"
  | "pending"
  | "superseded"
  | "approved"
  | "rejected"
  | "suspended"
  | "changes_requested"
  | "withdrawn"
  | "draft"
  | "open";

function asIso(v?: string) {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toISOString()
    : new Date().toISOString();
}

function normalizeApps(input: any): BidderApplicationRow[] {
  const rows = Array.isArray(input)
    ? input
    : Array.isArray(input?.rows)
      ? input.rows
      : [];
  return rows as BidderApplicationRow[];
}

function normalizeListingConversations(input: any): ListingReviewConversation[] {
  const rows = Array.isArray(input)
    ? input
    : Array.isArray(input?.conversations)
      ? input.conversations
      : [];
  return rows as ListingReviewConversation[];
}
function normalizeAuctionQuestionConversations(input: any): AuctionQuestionConversation[] {
  const rows = Array.isArray(input)
    ? input
    : Array.isArray(input?.conversations)
      ? input.conversations
      : [];
  return rows as AuctionQuestionConversation[];
}

function displayStatus(status: string) {
  return status.replace(/_/g, " ").toUpperCase();
}

function reviewStatus(conversation: ListingReviewConversation) {
  const latestReview = conversation.items
    ?.filter((item: any) => item.itemType === "listing_review_request")
    .sort((a: any, b: any) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0] as any;

  return (
    conversation.currentReviewRequest?.status ??
    (conversation.currentAuctionDraft ? "draft" : conversation.currentWorkflowStatus) ??
    latestReview?.payload?.reviewStatus ??
    "pending"
  );
}

function toApplicationMessageRows(apps: BidderApplicationRow[]): MessageRow[] {
  return apps.map((a) => {
    const u = a.user?.username
      ? `@${a.user.username}`
      : a.user?.email ?? a.accountId;

    const status = (a.status ?? "pending").toUpperCase();

    return {
      threadId: `application:${a.accountId}:${a.applicationId}`,
      fromName: u,
      subject: `Bidder application • ${status}`,
      preview:
        a.decisionNote ??
        `Account: ${a.accountId}${a.user?.email ? ` • ${a.user.email}` : ""}`,
      updatedAt: asIso(a.updatedAt ?? a.createdAt),
      unread: (a.status ?? "pending") === "pending",
    };
  });
}

function toListingConversationRows(conversations: ListingReviewConversation[]): MessageRow[] {
  return conversations.map((conversation) => {
    const title = conversation.listingSummary?.title ?? "Untitled listing";
    const status = reviewStatus(conversation);
    const countLabel = `${conversation.messageCount} ${conversation.messageCount === 1 ? "message" : "messages"}`;
    const unreadLabel = conversation.unreadCount
      ? ` • ${conversation.unreadCount} unread`
      : "";
    const address = conversation.listingSummary?.address
      ? ` • ${conversation.listingSummary.address}`
      : "";

    return {
      threadId: `listing:${conversation.listingId}`,
      fromName: conversation.currentReviewRequest?.submittedBy ?? "Listing",
      subject: `${title} • ${displayStatus(status)}`,
      preview: `${countLabel}${unreadLabel} • ${conversation.latestPreview}${address}`,
      updatedAt: asIso(conversation.lastActivityAt),
      unread: conversation.unreadCount > 0,
    };
  });
}
function toQuestionRows(conversations: AuctionQuestionConversation[]): MessageRow[] {
  return conversations.map((conversation) => {
    const title = conversation.listingSummary?.title || conversation.subject || "Auction question";
    const address = conversation.listingSummary?.address
      ? " • " + conversation.listingSummary.address
      : "";
    const countLabel = String(conversation.messageCount) + " " + (conversation.messageCount === 1 ? "message" : "messages");

    return {
      threadId: "question:" + conversation.threadId,
      fromName: conversation.buyerName || conversation.buyerEmail || conversation.buyerAccountId,
      subject: title + " • " + displayStatus(conversation.status),
      preview: countLabel + " • " + conversation.latestPreview + address,
      updatedAt: asIso(conversation.updatedAt),
      unread: conversation.unreadCount > 0,
    };
  });
}

export default function MessagesPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<MessagesTab>("inbox");
  const { revalidate } = useRevalidator();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchParams, setSearchParams] = useSearchParams();

  const root = useRouteLoaderData("root") as RootLoaderData | undefined;

  const apps = useMemo(
    () => normalizeApps(root?.bidderApplications),
    [root?.bidderApplications],
  );
  const listingConversations = useMemo(
    () => normalizeListingConversations(root?.listingReviewConversations),
    [root?.listingReviewConversations],
  );
  const questionConversations = useMemo(
    () => normalizeAuctionQuestionConversations(root?.auctionQuestionConversations),
    [root?.auctionQuestionConversations],
  );

  const rows = useMemo(
    () => [
      ...toApplicationMessageRows(apps),
      ...toListingConversationRows(listingConversations),
      ...toQuestionRows(questionConversations),
    ].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    [apps, listingConversations, questionConversations],
  );

  const metaByThreadId = useMemo(() => {
    const m = new Map<string, RowMeta>();

    apps.forEach((a) => {
      const threadId = `application:${a.accountId}:${a.applicationId}`;
      m.set(threadId, { kind: "application", status: a.status });
    });

    listingConversations.forEach((conversation) => {
      const threadId = `listing:${conversation.listingId}`;
      m.set(threadId, {
        kind: "listing_conversation",
        status: reviewStatus(conversation),
      });
    });
    questionConversations.forEach((conversation) => {
      const threadId = "question:" + conversation.threadId;
      m.set(threadId, {
        kind: "auction_question",
        status: conversation.status,
      });
    });

    return m;
  }, [apps, listingConversations, questionConversations]);

  const filteredByFilters = useMemo(() => {
    let next = rows;

    if (tab === "unread") next = next.filter((r) => r.unread);
    if (tab === "questions") {
      next = next.filter((r) => metaByThreadId.get(r.threadId)?.kind === "auction_question");
    }
    if (tab === "listings") {
      next = next.filter((r) => metaByThreadId.get(r.threadId)?.kind === "listing_conversation");
    }
    if (tab === "applicants") {
      next = next.filter((r) => metaByThreadId.get(r.threadId)?.kind === "application");
    }
    if (tab === "archived") next = next.filter((r) => !r.unread);

    if (statusFilter !== "all") {
      next = next.filter((r) => metaByThreadId.get(r.threadId)?.status === statusFilter);
    }

    return next;
  }, [rows, tab, statusFilter, metaByThreadId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filteredByFilters;

    return filteredByFilters.filter((r) => {
      return (
        r.fromName.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        r.preview.toLowerCase().includes(q)
      );
    });
  }, [filteredByFilters, search]);

  const [selected, setSelected] = useState<{ kind: RowMeta["kind"]; id: string } | null>(null);
  useEffect(() => {
    const listingId = searchParams.get("listingId");
    if (!listingId) return;
    if (!listingConversations.some((conversation) => conversation.listingId === listingId)) return;
    setTab("listings");
    setSelected({ kind: "listing_conversation", id: listingId });
  }, [listingConversations, searchParams]);

  function closeSelected() {
    setSelected(null);
    if (!searchParams.has("listingId")) return;
    const next = new URLSearchParams(searchParams);
    next.delete("listingId");
    setSearchParams(next, { replace: true });
  }

  const selectedApplication = useMemo(() => {
    if (selected?.kind !== "application") return null;
    return apps.find((a) => `${a.accountId}:${a.applicationId}` === selected.id) ?? null;
  }, [apps, selected]);
  const selectedListingConversation = useMemo(() => {
    if (selected?.kind !== "listing_conversation") return null;
    return listingConversations.find((conversation) => conversation.listingId === selected.id) ?? null;
  }, [listingConversations, selected]);
  const selectedQuestionConversation = useMemo(() => {
    if (selected?.kind !== "auction_question") return null;
    return questionConversations.find((conversation) => conversation.threadId === selected.id) ?? null;
  }, [questionConversations, selected]);

  function openFromRow(row: MessageRow) {
    const [kind, ...rest] = row.threadId.split(":");
    if (kind === "application") {
      setSelected({ kind: "application", id: rest.join(":") });
      return;
    }
    if (kind === "listing") {
      setSelected({ kind: "listing_conversation", id: rest.join(":") });
      return;
    }
    if (kind === "question") {
      setSelected({ kind: "auction_question", id: rest.join(":") });
    }
  }

  const frame = useMemo(
    () => ({
      title: "Messages",
      subtitle: `Showing ${filtered.length} of ${rows.length}`,
      tabs: <MessagesTabs value={tab} onChange={setTab} />,
      toolbar: (
        <MessagesToolbar
          search={search}
          onSearch={setSearch}
          right={
            <select
              className="tool__select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="draft">Auction draft</option>
              <option value="open">Open questions</option>
              <option value="changes_requested">Changes requested</option>
              <option value="superseded">Superseded</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="suspended">Suspended</option>
            </select>
          }
        />
      ),
      action: (
        <button
          onClick={() => alert("Compose later")}
          style={{
            minHeight: 38,
            padding: "0 14px",
            borderRadius: 8,
            border: "1px solid var(--dash-primary)",
            background: "var(--dash-primary)",
            color: "var(--dash-primary-fg)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Compose
        </button>
      ),
    }),
    [tab, search, filtered.length, rows.length, statusFilter],
  );

  useRegisterDashboardFrame(frame);

  return (
    <div>
      <MessagesTable rows={filtered} onRowClick={openFromRow} />

      <BidderApplicationDrawer
        open={!!selectedApplication}
        onClose={closeSelected}
        app={selectedApplication}
        onUpdated={() => {
          revalidate();
        }}
      />

      <ListingReviewDrawer
        open={!!selectedListingConversation}
        onClose={closeSelected}
        conversation={selectedListingConversation}
        onUpdated={() => {
          revalidate();
        }}
      />

      <QuestionDrawer
        open={!!selectedQuestionConversation}
        onClose={closeSelected}
        question={selectedQuestionConversation}
      />
    </div>
  );
}
