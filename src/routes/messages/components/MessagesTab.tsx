import React from "react";

export type MessagesTab = "inbox" | "unread" | "archived";

export function MessagesTabs({
  value,
  onChange,
}: {
  value: MessagesTab;
  onChange: (v: MessagesTab) => void;
}) {
  const items: { key: MessagesTab; label: string }[] = [
    { key: "inbox", label: "Inbox" },
    { key: "unread", label: "Unread" },
    { key: "archived", label: "Archived" },
  ];

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {items.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: active ? "#111827" : "#fff",
              color: active ? "#fff" : "#111827",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}