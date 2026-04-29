import React from "react";

export type MessageRow = {
  threadId: string;
  fromName: string;
  subject: string;
  preview: string;
  updatedAt: string;
  unread: boolean;
};

export function MessagesTable({
  rows,
  onRowClick,
}: {
  rows: MessageRow[];
  onRowClick: (row: MessageRow) => void;
}) {
  if (!rows.length) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 18,
          color: "#6b7280",
          fontSize: 13,
        }}
      >
        No messages found.
      </div>
    );
  }

  return (
    <div style={styles.table}>
      <div style={styles.headerRow}>
        <div>From</div>
        <div>Subject</div>
        <div>Preview</div>
        <div style={{ textAlign: "right" }}>Updated</div>
      </div>

      {rows.map((r) => (
        <div
          key={r.threadId}
          style={{
            ...styles.row,
            background: r.unread ? "#f9fafb" : "#fff",
          }}
          onClick={() => onRowClick(r)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {r.unread ? <UnreadDot /> : null}
            <span style={{ fontSize: 13, color: "#111827" }}>{r.fromName}</span>
          </div>

          <div style={{ fontSize: 13, color: "#111827" }}>{r.subject}</div>

          <div style={styles.muted} title={r.preview}>
            {r.preview}
          </div>

          <div style={{ textAlign: "right", ...styles.muted }}>
            {formatDate(r.updatedAt)}
          </div>
        </div>
      ))}
    </div>
  );
}

function UnreadDot() {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: 999,
        background: "#2563eb",
        display: "inline-block",
      }}
    />
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

const styles: Record<string, React.CSSProperties> = {
  table: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
  },
  headerRow: {
    display: "grid",
    gridTemplateColumns: "220px 1.2fr 2fr 220px",
    gap: 12,
    padding: "10px 14px",
    fontSize: 12,
    color: "#6b7280",
    borderBottom: "1px solid #e5e7eb",
    background: "#fafafa",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "220px 1.2fr 2fr 220px",
    gap: 12,
    padding: "12px 14px",
    borderBottom: "1px solid #f3f4f6",
    cursor: "pointer",
    alignItems: "center",
  },
  muted: {
    fontSize: 12,
    color: "#6b7280",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
};