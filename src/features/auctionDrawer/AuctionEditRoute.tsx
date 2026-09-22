import { useParams } from 'react-router-dom';
import { useDashboardPageContext } from '../../routes/auctions/auctionPageContext';
import AuctionPreparation from '../auctionPreparation/AuctionPreparation';

export default function AuctionEditRoute() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const { auctions, handleUpdate, handleDelete, handleCreated } = useDashboardPageContext();
  const row = auctions.find(a => a.auction.id === auctionId);
  if (!row) return <p>Auction preparation is unavailable. Return to Auctions and refresh the list.</p>;
  return <AuctionPreparation key={row.auction.id} row={row} onUpdate={handleUpdate} onReplace={(oldId, next) => { if (oldId !== next.auction.id) handleDelete(oldId); handleCreated(next); }} />;
}
