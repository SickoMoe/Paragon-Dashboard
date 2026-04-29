import React from "react";
import "./../../../style/AuctionsToolbar.css";

export function AuctionsToolbar({
  search,
  onSearch,
  right
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
          placeholder="Search"
        />
      </div>

      <div className="tool__actions">
        {right ?? (
          <>
            <button type="button" className="tool__btn">Assigned</button>
            <button type="button" className="tool__btn">Date</button>
            <button type="button" className="tool__btn">Group</button>
            <button type="button" className="tool__btn">Export</button>
          </>
        )}
      </div>
    </div>
  );
}