import { Outlet, useMatch, useNavigate, useParams } from "react-router-dom";
import { AuctionDrawerBreadcrumb } from "../../core/components/Breadcrumb";
import AuctionDrawer from "./AuctionDrawer";
import { useDashboardPageContext } from "../../routes/auctions/auctionPageContext";


export default function AuctionDrawerRoute() {
  const navigate = useNavigate();
  const { auctionId } = useParams<{ auctionId: string }>();
  const { auctions } = useDashboardPageContext();


  const row = auctions.find(a => a.auction.id === auctionId);
  if (!row) return null;
const isEdit = useMatch("/auctions/:auctionId/edit");

  return (
    <AuctionDrawer onClose={() => navigate("/auctions")}>
<AuctionDrawerBreadcrumb
  auctionId={row.auction.id}
  mode={isEdit ? "edit" : "overview"}
  onGoOverview={() => navigate(`/auctions/${row.auction.id}`)}
/>
      <Outlet />
    </AuctionDrawer>
  );
}