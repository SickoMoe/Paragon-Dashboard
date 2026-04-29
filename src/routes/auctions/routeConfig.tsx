import AuctionsPage from ".";
import { auctionLoader } from "./loader";

import AuctionEditRoute from "../../features/auctionDrawer/AuctionEditRoute";
import AuctionDrawerRoute from "../../features/auctionDrawer/AuctionDrawerRoute";
import BidDetailRoute from "../../features/auctionDrawer/BidDetailRoute";
import { auctionLeaderboardLoader } from "../../features/bidDrawer/auctionLeaderboardLoader";
import AuctionLeaderboardRoute from "../../features/bidDrawer/AuctionLeaderboardRoute";
import AuctionOverviewRoute from "../../features/auctionDrawer/AuctionOverviewRoute";

export const auctionRoute = {
  path: "auctions",
  element: <AuctionsPage />,
  loader: auctionLoader,
  children: [
    {
      path: ":auctionId",
      element: <AuctionDrawerRoute />, // ✅ LAYOUT ROUTE
      children: [
        {
          index: true,
          element: <AuctionOverviewRoute />, // /auctions/:auctionId
        },
        {
          path: "edit",
          element: <AuctionEditRoute />, // /auctions/:auctionId/edit
        },
        {
          path: "leaderboard",
          element: <AuctionLeaderboardRoute />, // /auctions/:auctionId/leaderboard
          loader:auctionLeaderboardLoader,
          children:[
                    {
  path:":bidId",
  element: <BidDetailRoute/>,


}
          ]
        },

      ],
    },
  ],
};