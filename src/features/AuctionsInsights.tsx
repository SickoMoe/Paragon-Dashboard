import { StatTile } from "./StatTile";

export function AuctionsInsights({ auctions }: { auctions: any[] }) {
  const liveCount = auctions.filter((row) => row.auction.status === "live").length;
  const endedWithBids = auctions.filter((row) => row.auction.status === "ended" && row.bid.bidCount > 0).length;
  const needsAttention = auctions.filter((row) => row.auction.status === "live" && row.bid.bidCount === 0).length;

  return (
    <div style={{ display: "flex", gap: 14 }}>
      <StatTile label="Live Auctions" value={String(liveCount)} sub="Currently accepting bids" tone="blue" />
      <StatTile label="Total Auctions" value={String(auctions.length)} sub="In current view" tone="green" />
      <StatTile label="Ended w/ Bids" value={String(endedWithBids)} sub="Completed auctions" tone="purple" />
      <StatTile
        label="Needs Attention"
        value={String(needsAttention)}
        sub="Live auctions w/o bids"
        tone="amber"
      />
    </div>
  );
}
