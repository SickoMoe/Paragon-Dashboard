import GenericRouteConfig from "./interfaces/iGenericRouteConfig";
import DashboardLayout from "./routes/dashboard/layout";
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
    messageRoute,
    { path: "users", element: <UsersPage /> },
   ],
}];


export default routesConfig;