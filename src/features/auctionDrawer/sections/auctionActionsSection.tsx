// // src/routes/dashboard/components/auctionDrawer/sections/AuctionActionsSection.tsx
// import React, { useState } from "react";
// import { primaryBtn } from "../styles";
// import { BidDetailPanel } from "../BidDetailPanel";
// import { BidsPanel } from "../../../routes/dashboard/components/BidsPanel";
// import { AuctionLeaderboardDTO } from "../../../routes/dashboard/services/auctionBidApi";
// import { AuctionOverview } from "../../auctions/types";

// type Props = {
//   row: AuctionOverview;
//   loading: boolean;
//   onDelete: () => void;

//   bidsOpen: boolean;
//   bidsLoading: boolean;
//   bidsError: string | null;
//   leaderboard: AuctionLeaderboardDTO | null;
//   onCloseBids: () => void;
//   handleOpenBids: () => void;

//   handleCloseBids: () => void;
// };

// export function AuctionActionsSection({
//   row,
//   loading,
//   onDelete,
//   bidsOpen,
//   bidsLoading,
//   bidsError,
//   leaderboard,
//   onCloseBids,
// handleOpenBids,

// handleCloseBids

// }: Props) {
//     const [selectedBid, setSelectedBid] = useState<any | null>(null);
//   return (
//     <section style={styles.wrap}>
//       <div style={styles.title}>Admin Actions</div>
//       <button onClick={handleOpenBids} disabled={loading} style={primaryBtn}>
//         {loading ? "Bids" : "View Bids"}
//       </button>

//       <button onClick={onDelete} disabled={loading} style={styles.dangerBtn}>
//         {loading ? "Deleting…" : "Delete Auction"}
//       </button>

//       {bidsOpen ? (
// <BidsPanel
//   onClose={handleCloseBids}
//   loading={bidsLoading}
//   error={bidsError}
//   leaderboard={leaderboard}
//   onSelectBid={setSelectedBid}
// />

//         ) : null}

//         {selectedBid ? (

//             <BidDetailPanel
//                 bid={selectedBid}
//                 onClose={() => setSelectedBid(null)}
//             />

//         ) : null}
//     </section>
//   );
// }
// const styles: Record<string, React.CSSProperties> = {
//   wrap: {
//     borderRadius: 16,
//     border: "1px solid #eef0f4",
//     background: "#fff",
//     padding: 14,
//   },
//   title: { fontSize: 12, fontWeight: 900, color: "#111827", marginBottom: 10 },
//   dangerBtn: {
//     width: "100%",
//     padding: "10px 12px",
//     borderRadius: 10,
//     border: "1px solid #fecaca",
//     background: "#fff",
//     color: "#b91c1c",
//     cursor: "pointer",
//     fontSize: 13,
//     fontWeight: 800,
//   },
// };