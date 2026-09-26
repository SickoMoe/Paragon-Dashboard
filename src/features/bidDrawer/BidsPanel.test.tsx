import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { BidsPanel } from "./BidsPanel";
import type { AuctionLeaderboardDTO } from "../auctions/services/auctionBidApi";
afterEach(cleanup);
const board = {
  auctionId: "auction",
  openingBid: 100,
  currentBid: 100,
  incrementAmount: 10,
  bids: [],
  auction: { status: "live", startDate: "2020-01-01", endDate: "2099-01-01" },
} as AuctionLeaderboardDTO;
const view = (leaderboard = board) => (
  <BidsPanel
    loading={false}
    error={null}
    leaderboard={leaderboard}
    onClose={vi.fn()}
    onSelectBid={vi.fn()}
    onRecordBid={vi.fn()}
  />
);
it("accepts the opening amount in the admin bid form and locks it after the deadline", () => {
  const { rerender } = render(view());
  fireEvent.click(screen.getByRole("button", { name: "Record bid" }));
  expect(screen.getByRole("spinbutton", { name: /Bid amount/ })).toHaveValue(100);
  rerender(view({ ...board, auction: { ...board.auction!, endDate: "2020-01-02" } }));
  expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Record bid" })).not.toBeInTheDocument();
});
it("shows the full count independently of recent history and retains voided records", () => {
  render(
    view({
      ...board,
      bidCount: 55,
      voidedBids: [
        {
          id: "voided",
          auctionId: "auction",
          amount: 200,
          bidderProfileId: "corrected-bidder",
          createdAt: "2026-09-25",
          source: "admin",
          status: "voided",
        },
      ],
    }),
  );
  expect(screen.getByText(/55 accepted bids/)).toBeInTheDocument();
  expect(screen.getByText(/Bidder: corrected-bidder/)).toBeInTheDocument();
});
