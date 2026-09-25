import { AssetsPage, AssetWorkspace, OpportunitiesPage, OpportunityWorkspace, ListingWorkspace } from "./features/assets/PortfolioPages";
import TransactionsPage, { TransactionWorkspace } from "./features/transactions/TransactionsPage";
import GenericRouteConfig from "./interfaces/iGenericRouteConfig";
import DashboardLayout from "./routes/dashboard/layout";
import SiteContentPage from "./features/siteContent";
import UsersPage from "./features/users";
import { messageRoute } from "./routes/messages/routeConfig";
import { auctionRoute } from "./routes/auctions/routeConfig";
import { rootLoader } from "./loader";


export const routesConfig: GenericRouteConfig[] = [
  {
    id:"root",
  path: "/",
  loader:rootLoader,
  element: <DashboardLayout />, // navbar + shell
  children: [
    auctionRoute,
    { path: "assets", element: <AssetsPage /> },
    { path: "assets/:assetId", element: <AssetWorkspace /> },
    { path: "opportunities", element: <OpportunitiesPage /> },
    { path: "opportunities/:opportunityId", element: <OpportunityWorkspace /> },
    { path: "listings/:listingId", element: <ListingWorkspace /> },
    { path: "transactions", element: <TransactionsPage /> },
    { path: "transactions/:transactionId", element: <TransactionWorkspace /> },
    messageRoute,
    { path: "users", element: <UsersPage /> },
    { path: "website", element: <SiteContentPage /> },
   ],
}];


export default routesConfig;