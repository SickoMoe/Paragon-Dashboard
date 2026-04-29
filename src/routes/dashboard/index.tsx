
// import { useDashboardController } from "./controllers/useDashboardController";

// import AuctionDrawerContainer from "./components/AuctionDrawerContainer";
// import { DashboardShell } from "./components/DashboardShell";
// import { AuctionsTable } from "./components/AuctionTable";
// import { AuctionsToolbar } from "./components/AuctionsToolbar";
// import { AuctionsTabs } from "./components/AuctionsTabs";
// import { useDashboardPageContext } from "./DashboardPageContext";
// import CreateAuctionDrawer from "./components/auctionCreate/CreateAuctionDrawer";
// import { useState } from "react";


// export default function DashboardPage() {
//   const { auctions } = useDashboardPageContext();

//   const {
//     filteredAuctions: filtered,
//     selectedAuction,
//     tab,
//     setTab,
//     search,
//     setSearch,
//     handleRowClick,
//     handleUpdate,
//     handleDelete,
//     handleCreated,
//     closeDrawer,
//   } = useDashboardController(auctions);
//   const [creating, setCreating] = useState(false);
//   return (
//     <DashboardShell
//   title="Auctions"
//   subtitle={`You have ${filtered.length} auctions`}
//   tabs={<AuctionsTabs value={tab} onChange={setTab} />}
//   action={      <button
//         onClick={() => setCreating(true)}
//         style={{
//           padding: "10px 12px",
//           borderRadius: 10,
//           border: "1px solid #e5e7eb",
//           background: "#111827",
//           color: "#fff",
//           cursor: "pointer",
//         }}
//       >
//         + New
//       </button>}
// toolbar={ <AuctionsToolbar
//       search={search}
//       onSearch={setSearch}
  
//     />}
// >
//       <AuctionsTable rows={filtered} onRowClick={handleRowClick} />

//       {/* {selectedAuction && (
//         <AuctionDrawerContainer
//           row={selectedAuction}
//           onClose={closeDrawer}
//           onUpdate={handleUpdate}
//           onDelete={handleDelete}
//         />
//       )} */}
//             {creating && (
//         <CreateAuctionDrawer
//           onClose={() => setCreating(false)}
//           onCreated={handleCreated}
//         />
//       )}
    
//     </DashboardShell>
//   );
// }
