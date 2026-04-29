// src/routes/messages/BidderApplicationDrawer.tsx
import React, { useMemo, useState } from "react";
import Drawer from "../../core/components/Drawer";
import { request } from "../../core/api/request";

export type BidderApplication = {
  accountId: string;
  applicationId: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  createdAt?: string;
  updatedAt?: string;
  user?: { username?: string; email?: string; phone?: string };
  payload?: Record<string, any>;
  decisionNote?: string;
};

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value ?? "—"}</div>
    </div>
  );
}

function Badge({ status }: { status: BidderApplication["status"] }) {
  const ui =
    status === "pending"
      ? { bg: "#FEF3C7", fg: "#92400E", label: "Pending" }
      : status === "approved"
      ? { bg: "#DCFCE7", fg: "#166534", label: "Approved" }
      : status === "rejected"
      ? { bg: "#FEE2E2", fg: "#991B1B", label: "Rejected" }
      : { bg: "#E5E7EB", fg: "#374151", label: "Suspended" };

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
      {ui.label}
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
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export default function BidderApplicationDrawer({
  open,
  onClose,
  app,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  app: BidderApplication | null;
  onUpdated?: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => {
    if (!app) return "Application";
    const u = app.user?.username ? `@${app.user.username}` : app.accountId;
    return `Bidder Application • ${u}`;
  }, [app]);

  const payloadEntries = useMemo(() => {
    if (!app?.payload) return [];
    return Object.entries(app.payload).filter(([_, v]) => v !== undefined);
  }, [app?.payload]);

  async function decide(kind: "approve" | "reject" | "suspend") {
    if (!app) return;
    setSaving(true);
    setError(null);
    try {
      await request(
        `/api/bidder/${app.accountId}/applications/${app.applicationId}/${kind}`,
        { method: "POST" },
      );
      onUpdated?.();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? `${kind} failed`);
    } finally {
      setSaving(false);
    }
  }

  // ✅ which actions should show based on status
  const actions = useMemo(() => {
    if (!app) return [];

    switch (app.status) {
      case "pending":
        return [
          { key: "reject", label: "Reject", variant: "ghost" as const, onClick: () => decide("reject") },
          { key: "approve", label: "Approve", variant: "solid" as const, onClick: () => decide("approve") },
        ];

      case "approved":
        return [
          // revoke approval -> suspended (keeps the history)
          { key: "revoke", label: "Revoke approval", variant: "ghost" as const, onClick: () => decide("suspend") },
          { key: "reject", label: "Reject instead", variant: "ghost" as const, onClick: () => decide("reject") },
        ];

      case "rejected":
        return [
          { key: "approve", label: "Approve anyway", variant: "solid" as const, onClick: () => decide("approve") },
        ];

      case "suspended":
        return [
          { key: "reject", label: "Reject", variant: "ghost" as const, onClick: () => decide("reject") },
          { key: "approve", label: "Re-approve", variant: "solid" as const, onClick: () => decide("approve") },
        ];

      default:
        return [];
    }
  }, [app]);

  return (
    <Drawer open={open} onClose={onClose} title={title} size={520} zIndex={70}>
      {!app ? (
        <div style={{ color: "#6b7280" }}>No application selected.</div>
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <Badge status={app.status} />
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              {app.status === "pending" ? "Awaiting decision" : "Decision recorded"}
            </div>
          </div>

          {error ? <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div> : null}

          <Detail label="Application ID" value={app.applicationId} />
          <Detail label="Account ID" value={app.accountId} />
          <Detail label="Username" value={app.user?.username} />
          <Detail label="Email" value={app.user?.email} />
          <Detail label="Phone" value={app.user?.phone} />
          <Detail label="Created" value={app.createdAt ? new Date(app.createdAt).toLocaleString() : undefined} />
          <Detail label="Updated" value={app.updatedAt ? new Date(app.updatedAt).toLocaleString() : undefined} />

          {app.decisionNote ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Decision note</div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10, fontSize: 13 }}>
                {app.decisionNote}
              </div>
            </div>
          ) : null}

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Application details</div>

            {!payloadEntries.length ? (
              <div style={{ color: "#6b7280", fontSize: 13 }}>No form details captured.</div>
            ) : (
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                {payloadEntries.map(([k, v], idx) => (
                  <div
                    key={k}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "160px 1fr",
                      gap: 10,
                      padding: "10px 12px",
                      borderTop: idx === 0 ? "none" : "1px solid #f3f4f6",
                      background: "#fff",
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{prettyLabel(k)}</div>
                    <div style={{ fontSize: 13, color: "#111827", fontWeight: 600 }}>{formatAny(v)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ✅ dynamic actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            {actions.map((a) => (
              <button
                key={a.key}
                onClick={a.onClick}
                disabled={saving}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: a.variant === "solid" ? "#111827" : "#fff",
                  color: a.variant === "solid" ? "#fff" : "#111827",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {a.label}
              </button>
            ))}
          </div>

          {saving ? <div style={{ marginTop: 10, color: "#6b7280" }}>Saving…</div> : null}
        </div>
      )}
    </Drawer>
  );
}