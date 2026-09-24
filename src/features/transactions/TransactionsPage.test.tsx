import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { request } from "../../core/api/request";
import TransactionsPage, { TransactionWorkspace } from "./TransactionsPage";
import type { Transaction } from "./types";
vi.mock("../../core/api/request", () => ({ request: vi.fn() }));
const fixture = (): Transaction => ({
  transactionId: "closing-1",
  auctionId: "auction-1",
  listingId: "property-1",
  winningBidId: "bid-1",
  winningAmount: 250000,
  currency: "USD",
  revision: 3,
  role: "admin",
  status: "pending_agreement",
  agreementStatus: "not_ready",
  agreementDueAt: null,
  agreementReadyAt: null,
  agreementSentAt: null,
  agreementSignedAt: null,
  depositStatus: "not_due",
  depositAmount: null,
  depositDueAt: null,
  depositReceivedAt: null,
  closingStatus: "not_started",
  closingDate: null,
  createdAt: "2026-09-01",
  updatedAt: "2026-09-01",
  completedAt: null,
  cancelledAt: null,
  failedAt: null,
  terminationReason: null,
  locked: false,
  nextAction: "Prepare the agreement.",
  property: {
    title: "Test Oak House",
    address: "1 Test Way",
    city: "Austin",
    state: "TX",
    zipcode: "78701",
    image: null,
  },
  origin: {
    finalizedAt: "2026-09-01",
    reserveMet: true,
    reservePrice: 200000,
    winningBidId: "bid-1",
    winningAmount: 250000,
  },
  buyer: { name: "Buyer Example", accountId: "buyer", email: "buyer@example.test" },
  seller: { name: "Seller Example", accountId: "seller", email: "seller@example.test" },
  notes: [],
  documents: [],
  timeline: [],
});
function workspace() {
  render(
    <MemoryRouter initialEntries={["/transactions/closing-1"]}>
      <Routes>
        <Route path="/transactions/:transactionId" element={<TransactionWorkspace />} />
      </Routes>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(request).mockResolvedValue(fixture());
});
afterEach(cleanup);
it("shows the saved origin and participant contacts", async () => {
  workspace();
  expect(await screen.findByRole("heading", { name: "Test Oak House" })).toBeInTheDocument();
  expect(screen.getByText("Finalized auction result")).toBeInTheDocument();
  expect(screen.getByText("Buyer Example · buyer@example.test")).toBeInTheDocument();
  expect(screen.getByText("Satisfied")).toBeInTheDocument();
});
it("preserves a rejected milestone edit and retries with the loaded revision", async () => {
  let attempts = 0;
  vi.mocked(request).mockImplementation(async (_url, init) => {
    if (init?.method === "PATCH") {
      if (++attempts === 1) throw new Error("Upload an agreement first");
      return { ...fixture(), agreementStatus: "ready", revision: 4 };
    }
    return fixture();
  });
  workspace();
  await screen.findByText("Finalized auction result");
  fireEvent.click(screen.getByRole("button", { name: "Agreement" }));
  fireEvent.change(screen.getByLabelText("Agreement status"), { target: { value: "ready" } });
  expect(
    screen.getByText("Save your milestone changes before changing documents."),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Document")).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Save agreement" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Upload an agreement first");
  expect(screen.getByLabelText("Agreement status")).toHaveValue("ready");
  fireEvent.click(screen.getByRole("button", { name: "Save agreement" }));
  await screen.findByText("Saved. Participants can see the updated closing progress.");
  const writes = vi.mocked(request).mock.calls.filter(([, init]) => init?.method === "PATCH");
  expect(writes).toHaveLength(2);
  expect(JSON.parse(writes[1][1]!.body as string)).toEqual({
    revision: 3,
    agreementStatus: "ready",
    agreementDueAt: null,
  });
  expect(screen.getByLabelText("Document")).not.toBeDisabled();
});
it("cannot complete until the saved closing milestone is complete", async () => {
  workspace();
  await screen.findByText("Finalized auction result");
  fireEvent.click(screen.getByRole("button", { name: "Closing" }));
  expect(screen.getByRole("button", { name: "Complete transaction" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Closing status"), { target: { value: "completed" } });
  expect(screen.getByRole("button", { name: "Complete transaction" })).toBeDisabled();
});
it("requires a correction reason to edit a completed transaction", async () => {
  vi.mocked(request).mockResolvedValue({
    ...fixture(),
    status: "completed",
    closingStatus: "completed",
    locked: true,
  });
  workspace();
  await screen.findByText("Finalized auction result");
  fireEvent.click(screen.getByRole("button", { name: "Closing" }));
  expect(screen.getByRole("button", { name: "Save closing" })).toBeDisabled();
  fireEvent.click(screen.getByLabelText("Make an admin correction"));
  expect(screen.getByRole("button", { name: "Save closing" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Correction reason"), {
    target: { value: "Correct recorded date" },
  });
  expect(screen.getByRole("button", { name: "Save closing" })).not.toBeDisabled();
});
it("recovers an unavailable detail page using refresh", async () => {
  vi.mocked(request)
    .mockRejectedValueOnce(new Error("Temporary failure"))
    .mockResolvedValue(fixture());
  workspace();
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Refresh transaction" }));
  await screen.findByRole("heading", { name: "Test Oak House" });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
it("lists real managed transactions and forwards the auction filter", async () => {
  vi.mocked(request).mockResolvedValue([fixture()]);
  render(
    <MemoryRouter initialEntries={["/transactions?auction=auction-1"]}>
      <TransactionsPage />
    </MemoryRouter>,
  );
  await waitFor(() =>
    expect(request).toHaveBeenCalledWith("/api/transactions/manage?auctionId=auction-1"),
  );
  expect(await screen.findByRole("heading", { name: "Test Oak House" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Manage closing/ })).toHaveAttribute(
    "href",
    "/transactions/closing-1",
  );
});
