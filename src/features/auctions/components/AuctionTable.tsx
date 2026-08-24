import type { IAuction } from "../../../interfaces/IAuction";
import { AuctionOverview } from "../types";
import { getListingThumbnail } from "../utils/listingMedia";
import "../../../style/table.css";



type Props = {
  rows: AuctionOverview[];
  onRowClick: (row: AuctionOverview) => void;
};

export function AuctionsTable({ rows, onRowClick }: Props) {
  return (
    <div className="adminTable adminTable--auctions">
      <TableHeader />
      {rows.map((row) => (
        <TableRow key={row.auction.id} row={row} onClick={() => onRowClick(row)} />
      ))}
    </div>
  );
}

/* ───────────────────────────── Components ───────────────────────────── */

function TableHeader() {
  return (
    <div className="adminTable__row adminTable__row--header">
      <div>Status</div>
      <div>Property</div>
      <div>Schedule</div>
      <div className="adminTable__right">Current Bid</div>
      <div className="adminTable__right">Starting</div>
    </div>
  );
}

function TableRow({ row, onClick }: { row: AuctionOverview; onClick: () => void }) {
  const a = row.auction;
  const l = row.listing;

  const loc = l.basicInformation.location;
  const img = getListingThumbnail(l);

  return (
    <div className="adminTable__row adminTable__row--body" onClick={onClick} role="button" tabIndex={0}>
      {/* Status */}
      <div className="adminTable__statusCell">
        <StatusDot status={a.status} />
        <span className="adminTable__muted">{a.status}</span>
      </div>

      {/* Property */}
      <div className="adminTable__propertyCell">
        <Thumb img={img} />
        <div className="adminTable__propertyText">
          <div className="adminTable__primaryText">{l.basicInformation.title}</div>
          <div className="adminTable__muted">
            {loc.address}, {loc.city}, {loc.state} {loc.zipcode}
          </div>
        <div className="adminTable__muted">
          {row.auctionDraft ? "Auction draft" : `Auction: ${a.id}`}
        </div>
        </div>
      </div>

      {/* Schedule */}
      <div>
        <div className="adminTable__primaryText">{formatDate(a.startDate)}</div>
        <div className="adminTable__muted">{formatDate(a.endDate)}</div>
      </div>

      {/* Current bid (from row.bid) */}
      <div className="adminTable__moneyCell">{formatMoney(row.bid.currentBid)}</div>

      {/* Starting bid (prefer auction.startingBid; fall back to bid.openingBid) */}
      <div className="adminTable__moneyCell">
        {formatMoney(a.startingBid ?? row.bid.openingBid)}
      </div>
    </div>
  );
}

function Thumb({ img }: { img: string }) {
  return (
    <div className="adminTable__thumbWrap">
      {img ? <img src={img} alt="" className="adminTable__thumbImg" /> : <div className="adminTable__thumbFallback" />}
    </div>
  );
}

function StatusDot({ status }: { status: IAuction["status"] }) {
  const color =
    status === "live"
      ? "#16a34a"
      : status === "paused"
      ? "#2563eb"
      : status === "scheduled"
      ? "#f59e0b"
      : status === "pending_approval" || status === "changes_requested"
      ? "#7c3aed"
      : status === "draft" || status === "archived"
      ? "#6b7280"
      : status === "ended"
      ? "#111827"
      : "#ef4444";

  return <span className="adminTable__statusDot" style={{ background: color }} />;
}

/* ───────────────────────────── Helpers ───────────────────────────── */

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function formatMoney(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString()}`;
}
