import React from "react";
import { useNavigate } from "react-router-dom";
import Drawer from "../../core/components/Drawer";

export type AuctionQuestionConversation = {
  threadId: string;
  auctionId: string;
  listingId?: string;
  buyerAccountId: string;
  buyerName: string;
  buyerEmail?: string;
  buyerUserType?: string;
  agentId: string;
  subject: string;
  status: "open" | "archived";
  unreadCount: number;
  messageCount: number;
  latestPreview: string;
  firstMessage?: string;
  createdAt: string;
  updatedAt: string;
  listingSummary?: {
    title?: string;
    address?: string;
  };
  messages?: Array<{
    id: string;
    threadId: string;
    senderId: string;
    body: string;
    createdAt: string;
  }>; 
};

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

function Badge({ status }: { status: AuctionQuestionConversation["status"] }) {
  const ui =
    status === "open"
      ? { bg: "rgba(212, 165, 116, 0.18)", fg: "var(--dash-warning)" }
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

function formatDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function QuestionDrawer({
  open,
  onClose,
  question,
}: {
  open: boolean;
  onClose: () => void;
  question: AuctionQuestionConversation | null;
}) {
  const navigate = useNavigate();
  const title = question ? "Question • " + question.buyerName : "Question";
  const messages = question?.messages ?? [];

  return (
    <Drawer open={open} onClose={onClose} title={title} size={540} zIndex={70}>
      {!question ? (
        <div style={{ color: "var(--dash-muted)" }}>No question selected.</div>
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <Badge status={question.status} />
            <div style={{ fontSize: 12, color: "var(--dash-muted)" }}>
              {question.unreadCount ? String(question.unreadCount) + " unread" : "Viewed"}
            </div>
          </div>

          <Detail label="Buyer" value={question.buyerName} />
          <Detail label="Email" value={question.buyerEmail} />
          <Detail label="Account ID" value={question.buyerAccountId} />
          <Detail label="Auction ID" value={question.auctionId} />
          <Detail label="Listing" value={question.listingSummary?.title || question.subject} />
          <Detail label="Address" value={question.listingSummary?.address} />
          <Detail label="Created" value={formatDate(question.createdAt)} />
          <Detail label="Updated" value={formatDate(question.updatedAt)} />

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: "var(--dash-muted)", marginBottom: 8 }}>Question</div>
            <div
              style={{
                border: "1px solid var(--dash-border)",
                borderRadius: 12,
                padding: 12,
                color: "var(--dash-ink)",
                background: "var(--dash-card)",
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
              }}
            >
              {question.firstMessage || question.latestPreview}
            </div>
          </div>

          {messages.length > 1 ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: "var(--dash-muted)", marginBottom: 8 }}>Thread</div>
              <div style={{ display: "grid", gap: 10 }}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      border: "1px solid var(--dash-border)",
                      borderRadius: 12,
                      padding: 12,
                      background: "var(--dash-surface)",
                    }}
                  >
                    <div style={{ fontSize: 12, color: "var(--dash-muted)", marginBottom: 6 }}>
                      {formatDate(message.createdAt)}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{message.body}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => navigate("/auctions?auctionId=" + encodeURIComponent(question.auctionId))}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--dash-border)",
                background: "var(--dash-ink)",
                color: "var(--dash-card)",
                cursor: "pointer",
              }}
            >
              Open auction
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
