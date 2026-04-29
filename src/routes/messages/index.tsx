// src/routes/messages/index.tsx (MessagesPage)
import React, { useMemo, useState } from "react";
import { useRouteLoaderData } from "react-router-dom";
import { useRegisterDashboardFrame } from "../../core/useRegisterDashboardFrame";
import { MessagesTab, MessagesTabs } from "./components/MessagesTab";
import { MessagesToolbar } from "./components/MessagesToolbar";
import { MessageRow, MessagesTable } from "./components/MessagesTable";
import BidderApplicationDrawer from "./BidderApplicationDrawer";
import type { RootLoaderData } from "../../loader";

export type BidderApplicationRow = {
  accountId: string;
  applicationId: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  bidderStatus: "none" | "pending" | "approved" | "rejected" | "suspended";
  createdAt: string;
  updatedAt: string;
  user?: { username?: string; email?: string; phone?: string };
  payload?: Record<string, any>;
  decisionNote?: string;
};

type RowMeta = {
  kind: "application" | "message";
  applicationStatus?: BidderApplicationRow["status"];
};

type InboxKindFilter = "all" | "applications" | "messages";
type AppStatusFilter = "all" | "pending" | "approved" | "rejected" | "suspended";

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

function toMessageRows(apps: BidderApplicationRow[]): MessageRow[] {
  return apps.map((a) => {
    const u = a.user?.username
      ? `@${a.user.username}`
      : a.user?.email ?? a.accountId;

    const status = (a.status ?? "pending").toUpperCase();

    return {
      threadId: `${a.accountId}:${a.applicationId}`, // stable + unique
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

export default function MessagesPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<MessagesTab>("inbox");

  // ✅ filters
  const [kindFilter, setKindFilter] = useState<InboxKindFilter>("all");
  const [appStatus, setAppStatus] = useState<AppStatusFilter>("all");

  const root = useRouteLoaderData("root") as RootLoaderData | undefined;

  const apps = useMemo(
    () => normalizeApps(root?.bidderApplications),
    [root?.bidderApplications],
  );

  // ✅ build MessageRows
  const rows = useMemo(() => toMessageRows(apps), [apps]);

  // ✅ metadata map (so Inbox can later include real messages too)
  const metaByThreadId = useMemo(() => {
    const m = new Map<string, RowMeta>();

    apps.forEach((a) => {
      const threadId = `${a.accountId}:${a.applicationId}`;
      m.set(threadId, { kind: "application", applicationStatus: a.status });
    });

    // later: for real messages
    // messages.forEach(m => map.set(m.threadId, { kind: "message" }))

    return m;
  }, [apps]);

  // ✅ apply tabs + filters first
  const filteredByFilters = useMemo(() => {
    let next = rows;

    // tabs behavior
    if (tab === "unread") next = next.filter((r) => r.unread);
    if (tab === "archived") next = next.filter((r) => !r.unread);

    // kind filter
    if (kindFilter !== "all") {
      next = next.filter((r) => {
        const meta = metaByThreadId.get(r.threadId);
        return kindFilter === "applications"
          ? meta?.kind === "application"
          : meta?.kind === "message";
      });
    }

    // app status filter (only meaningful for applications)
    if (appStatus !== "all") {
      next = next.filter((r) => {
        const meta = metaByThreadId.get(r.threadId);
        return meta?.kind === "application" && meta.applicationStatus === appStatus;
      });
    }

    return next;
  }, [rows, tab, kindFilter, appStatus, metaByThreadId]);

  // ✅ then search
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

  // ✅ drawer state
  const [selected, setSelected] = useState<BidderApplicationRow | null>(null);
  const drawerOpen = !!selected;

  function openFromRow(row: MessageRow) {
    const [accountId, applicationId] = row.threadId.split(":");
    const app =
      apps.find((a) => a.accountId === accountId && a.applicationId === applicationId) ??
      null;
    setSelected(app);
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
            <div style={{ display: "flex", gap: 8 }}>
              <select
                className="tool__select"
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value as InboxKindFilter)}
              >
                <option value="all">All</option>
                <option value="applications">Applications</option>
                <option value="messages">Messages</option>
              </select>

              <select
                className="tool__select"
                value={appStatus}
                onChange={(e) => setAppStatus(e.target.value as AppStatusFilter)}
                disabled={kindFilter === "messages"}
                title={
                  kindFilter === "messages"
                    ? "Status filter applies to applications"
                    : undefined
                }
              >
                <option value="all">All status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          }
        />
      ),
      action: (
        <button
          onClick={() => alert("Compose later")}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "#111827",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          + Compose
        </button>
      ),
    }),
    [tab, search, filtered.length, rows.length, kindFilter, appStatus],
  );

  useRegisterDashboardFrame(frame);

  return (
    <div>
      <MessagesTable rows={filtered} onRowClick={openFromRow} />

      <BidderApplicationDrawer
        open={drawerOpen}
        onClose={() => setSelected(null)}
        app={selected}
        onUpdated={() => {
          // later: revalidate root loader
        }}
      />
    </div>
  );
}