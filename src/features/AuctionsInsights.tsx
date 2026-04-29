import { StatTile } from "./StatTile";

export function AuctionsInsights({ auctions }: { auctions: any[] }) {
  return (
    <div style={{ display: "flex", gap: 14 }}>
      <StatTile
        label="Active Bids"
        value="18"
        sub="Across live auctions"
        tone="blue"
      />
      <StatTile
        label="Momentum"
        value="+6"
        sub="New bids today"
        tone="green"
      />
      <StatTile
        label="Completion Rate"
        value="83%"
        sub="Ended auctions w/ bids"
        tone="purple"
      />
      <StatTile
        label="Needs Attention"
        value="2"
        sub="Live auctions w/o bids"
        tone="amber"
      />
    </div>
  );
}