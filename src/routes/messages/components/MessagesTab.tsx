import "../../../style/AuctionsTabs.css";

export type MessagesTab = "inbox" | "unread" | "questions" | "listings" | "applicants" | "archived";

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
    { key: "questions", label: "Questions" },
    { key: "listings", label: "Listings" },
    { key: "applicants", label: "Applicants" },
    { key: "archived", label: "Archived" },
  ];

  return (
    <div className="tabs">
      {items.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`tabs__item ${active ? "is-active" : ""}`}
            type="button"
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
