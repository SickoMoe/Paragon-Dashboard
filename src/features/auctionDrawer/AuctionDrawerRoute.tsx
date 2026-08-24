import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Outlet, useMatch, useNavigate, useParams } from "react-router-dom";
import { AuctionDrawerBreadcrumb } from "../../core/components/Breadcrumb";
import AuctionDrawer from "./AuctionDrawer";
import { useDashboardPageContext } from "../../routes/auctions/auctionPageContext";

type CloseGuard = () => boolean;

type AuctionDrawerCloseGuardContextValue = {
  setCloseGuard: (guard: CloseGuard | null) => void;
};

const AuctionDrawerCloseGuardContext = createContext<AuctionDrawerCloseGuardContextValue | null>(null);

export function useAuctionDrawerCloseGuard(guard: CloseGuard) {
  const ctx = useContext(AuctionDrawerCloseGuardContext);

  useEffect(() => {
    if (!ctx) return;
    ctx.setCloseGuard(guard);
    return () => ctx.setCloseGuard(null);
  }, [ctx, guard]);
}

export default function AuctionDrawerRoute() {
  const navigate = useNavigate();
  const { auctionId } = useParams<{ auctionId: string }>();
  const { auctions } = useDashboardPageContext();
  const [closeGuard, setCloseGuard] = useState<CloseGuard | null>(null);

  const isEdit = useMatch("/auctions/:auctionId/edit");

  const handleClose = useCallback(() => {
    if (closeGuard && !closeGuard()) return;
    navigate("/auctions");
  }, [closeGuard, navigate]);

  const contextValue = useMemo<AuctionDrawerCloseGuardContextValue>(
    () => ({
      setCloseGuard: (guard) => {
        setCloseGuard(() => guard);
      },
    }),
    [],
  );

  const row = auctions.find(a => a.auction.id === auctionId);
  if (!row) return null;

  return (
    <AuctionDrawer onClose={handleClose} size={isEdit ? 640 : 460}>
      <AuctionDrawerCloseGuardContext.Provider value={contextValue}>
        <AuctionDrawerBreadcrumb
          auctionId={row.auction.id}
          mode={isEdit ? "edit" : "overview"}
          onGoAuctions={handleClose}
          onGoOverview={() => navigate(`/auctions/${row.auction.id}`)}
          onClose={handleClose}
        />
        <Outlet />
      </AuctionDrawerCloseGuardContext.Provider>
    </AuctionDrawer>
  );
}
