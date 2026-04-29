import React from "react";
import "./MessagesToolbar.css";

export function MessagesToolbar({
  search,
  onSearch,
  right,
}: {
  search: string;
  onSearch: (v: string) => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="tool">
      <div className="tool__search">
        <span className="tool__icon">⌕</span>
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search messages"
        />
      </div>

      <div className="tool__actions">
        {right ?? (
          <>
            <button type="button" className="tool__btn">
              Filter
            </button>
            <button type="button" className="tool__btn">
              Sort
            </button>
          </>
        )}
      </div>
    </div>
  );
}