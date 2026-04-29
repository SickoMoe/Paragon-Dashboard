import Drawer from "../../core/components/Drawer";
import { BidDTO } from "../auctions/services/auctionBidApi";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}

export function BidDetailPanel({
  bid,
  onClose,
}: {
  bid: BidDTO;
  onClose: () => void;
}) {
  return (
    <Drawer
      open
      onClose={onClose}
      title="Bid Details"
      size={360}
      zIndex={70}
      rightOffset={420} // sits next to the 420px bids panel
    >
      <Detail label="Amount" value={`$${Number(bid.amount).toLocaleString()}`} />
      <Detail label="Placed At" value={new Date(bid.createdAt).toLocaleString()} />
      <Detail label="Bidder Profile ID" value={bid.bidderProfileId} />
      <Detail label="Source" value={bid.source ?? "—"} />
      <Detail label="Auction ID" value={bid.auctionId} />
    </Drawer>
  );
}