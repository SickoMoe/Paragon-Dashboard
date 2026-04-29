import { IAuction } from "../../../interfaces/IAuction";
import "../../../style/AuctionsTabs.css";

export type AuctionTab = "all" | IAuction["status"];
export type AuctionCounts = Partial<Record<AuctionTab, number>>;

const ORDER: { key: AuctionTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "scheduled", label: "Scheduled" },
  { key: "live", label: "Live" },
  { key: "ended", label: "Ended" },
  { key: "cancelled", label: "Cancelled" },
];

export function AuctionsTabs({
  value,
  onChange,
  counts,
}: {
  value: AuctionTab;
  onChange: (v: AuctionTab) => void;
  counts: AuctionCounts;
}) {
  return (
    <div className="tabs">
      {ORDER.map((t) => {
        const count = counts[t.key];

        return (
          <button
            key={t.key}
            className={`tabs__item ${value === t.key ? "is-active" : ""}`}
            onClick={() => onChange(t.key)}
            type="button"
          >
            <span>{t.label}</span>

            {typeof count === "number" && (
              <span className="tabs__count"> { count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}