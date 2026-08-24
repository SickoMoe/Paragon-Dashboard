import React from "react";
import "../../../style/table.css";

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
      <div className="adminTable__empty">
        No messages found.
      </div>
    );
  }

  return (
    <div className="adminTable adminTable--messages">
      <div className="adminTable__row adminTable__row--header">
        <div>From</div>
        <div>Subject</div>
        <div>Preview</div>
        <div className="adminTable__right">Updated</div>
      </div>

      {rows.map((r) => (
        <div
          key={r.threadId}
          className={`adminTable__row adminTable__row--body ${r.unread ? "adminTable__row--unread" : ""}`}
          onClick={() => onRowClick(r)}
        >
          <div className="adminTable__statusCell">
            {r.unread ? <UnreadDot /> : null}
            <span className="adminTable__primaryText">{r.fromName}</span>
          </div>

          <div className="adminTable__primaryText">{r.subject}</div>

          <div className="adminTable__muted adminTable__truncate" title={r.preview}>
            {r.preview}
          </div>

          <div className="adminTable__muted adminTable__right">
            {formatDate(r.updatedAt)}
          </div>
        </div>
      ))}
    </div>
  );
}

function UnreadDot() {
  return (
    <span className="adminTable__statusDot adminTable__statusDot--unread" />
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}
