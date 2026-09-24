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
  await screen.findByText(
    "Saved. Participant-visible information is updated; internal details stay private.",
  );
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

function terminalFixture(status = "completed"): Transaction {
  return {
    ...fixture(),
    status,
    agreementStatus: status === "completed" ? "signed" : "void",
    depositStatus: "received",
    depositAmount: 25000,
    depositReceivedAt: "2026-09-19T17:00:00Z",
    closingStatus: status === "completed" ? "completed" : "cancelled",
    closingDate: "2026-09-20T17:00:00Z",
    completedAt: status === "completed" ? "2026-09-20T18:00:00Z" : null,
    locked: true,
    management: {
      correctionFields: ["closingDate", "depositReceivedAt", "depositAmount"],
      canReopen: true,
      reopenBlockedReason: null,
    },
    documents: [
      {
        documentId: "doc-1",
        filename: "Agreement.pdf",
        category: "purchase_agreement",
        visibility: "participants",
        contentType: "application/pdf",
        size: 100,
        uploadedAt: "2026-09-01",
      },
    ],
  };
}
it.each(["completed", "cancelled", "failed"])(
  "keeps %s milestone panels read-only and offers valid record corrections under Advanced",
  async (status) => {
    vi.mocked(request).mockResolvedValue(terminalFixture(status));
    workspace();
    await screen.findByText("Finalized auction result");
    fireEvent.click(screen.getByRole("button", { name: "Closing" }));
    expect(screen.queryByRole("button", { name: "Save closing" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Make an admin correction")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Closing status")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Advanced transaction management" }));
    expect(screen.getByRole("heading", { name: "Correct record" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save record correction" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Corrected value"), {
      target: { value: "2026-09-19T12:00" },
    });
    fireEvent.change(screen.getByLabelText("Correction reason"), {
      target: { value: "Correct recorded date" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save record correction" }));
    await screen.findByText("Record corrected. The terminal status is unchanged.");
    const call = vi.mocked(request).mock.calls.find(([url]) => url.endsWith("/corrections"))!;
    const body = JSON.parse(call[1]!.body as string);
    expect(body).toMatchObject({ revision: 3, correctionReason: "Correct recorded date" });
    expect(body).not.toHaveProperty("status");
    expect(body).not.toHaveProperty("closingStatus");
  },
);
it("requires a deliberate resume point, reason and confirmation before one reopen request", async () => {
  vi.mocked(request).mockResolvedValue(terminalFixture("cancelled"));
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  workspace();
  await screen.findByText("Finalized auction result");
  fireEvent.click(screen.getByRole("button", { name: "Advanced transaction management" }));
  fireEvent.click(screen.getByRole("button", { name: "Reopen transaction" }));
  expect(screen.getByLabelText("Resume point")).toHaveValue("");
  const submit = screen.getAllByRole("button", { name: "Reopen transaction" }).slice(-1)[0]!;
  expect(submit).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Resume point"), {
    target: { value: "pending_agreement" },
  });
  fireEvent.change(screen.getByLabelText("Reopening reason"), {
    target: { value: "Resume after review" },
  });
  fireEvent.click(submit);
  expect(vi.mocked(request).mock.calls.some(([url]) => url.endsWith("/reopen"))).toBe(false);
  confirm.mockReturnValue(true);
  fireEvent.click(submit);
  await screen.findByText("Transaction reopened. Participants have been notified.");
  const calls = vi.mocked(request).mock.calls.filter(([url]) => url.endsWith("/reopen"));
  expect(calls).toHaveLength(1);
  expect(JSON.parse(calls[0][1]!.body as string)).toEqual({
    revision: 3,
    targetStatus: "pending_agreement",
    reason: "Resume after review",
    confirmed: true,
  });
  confirm.mockRestore();
});
it("keeps a failed reopen form intact so an admin can correct it and retry", async () => {
  vi.mocked(request).mockImplementation(async (url) => {
    if (url.endsWith("/reopen"))
      throw new Error("This transaction changed. Refresh before saving.");
    return terminalFixture("failed");
  });
  vi.spyOn(window, "confirm").mockReturnValue(true);
  workspace();
  await screen.findByText("Finalized auction result");
  fireEvent.click(screen.getByRole("button", { name: "Advanced transaction management" }));
  fireEvent.click(screen.getByRole("button", { name: "Reopen transaction" }));
  fireEvent.change(screen.getByLabelText("Resume point"), {
    target: { value: "pending_agreement" },
  });
  fireEvent.change(screen.getByLabelText("Reopening reason"), {
    target: { value: "Retain this reason" },
  });
  fireEvent.click(screen.getAllByRole("button", { name: "Reopen transaction" }).slice(-1)[0]!);
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Reopening reason")).toHaveValue("Retain this reason");
  expect(screen.getByLabelText("Resume point")).toHaveValue("pending_agreement");
  vi.restoreAllMocks();
});
it("never exposes reopening for an invalidated auction result", async () => {
  const t = terminalFixture("failed");
  t.management!.canReopen = false;
  t.management!.reopenBlockedReason = "The finalized auction result was invalidated.";
  t.resultCorrections = [{ at: "2026-09-20", reason: "Invalid result" }];
  vi.mocked(request).mockResolvedValue(t);
  workspace();
  await screen.findByText("Finalized auction result");
  fireEvent.click(screen.getByRole("button", { name: "Advanced transaction management" }));
  expect(screen.queryByRole("button", { name: "Reopen transaction" })).not.toBeInTheDocument();
  expect(screen.getByText(/Reopening unavailable/)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Correct record" })).toBeInTheDocument();
});
