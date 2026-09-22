import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AuctionPreparation from "./AuctionPreparation";
import type { AuctionOverview } from "../auctions/types";
import { request } from "../../core/api/request";
const mocks = vi.hoisted(() => ({ navigate: vi.fn(), revalidate: vi.fn() }));
vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
  useRevalidator: () => ({ revalidate: mocks.revalidate }),
}));
vi.mock("../auctionDrawer/AuctionDrawerRoute", () => ({ useAuctionDrawerCloseGuard: vi.fn() }));
vi.mock("../liquidation/LiquidationReview", () => ({
  default: () => <div>Seller authority review controls</div>,
}));
vi.mock("../../core/api/request", () => ({ request: vi.fn() }));
const ready = {
  ready: true,
  checks: [
    { code: "listing_approved", label: "Listing approved", satisfied: true },
    { code: "authority_verified", label: "Seller authority verified", satisfied: true },
    { code: "auction_terms", label: "Terms available", satisfied: true },
  ],
  blockers: [],
};
const row = {
  auction: {
    id: "draft",
    listingId: "property",
    status: "draft",
    startingBid: 100,
    startDate: "2098-01-01T12:00:00Z",
    endDate: "2099-01-01T12:00:00Z",
    rules: { bidIncrement: 10 },
    isPrivate: false,
    updatedAt: "v1",
  },
  auctionDraft: {
    id: "draft",
    status: "draft",
    updatedAt: "v1",
    payload: {
      listingId: "property",
      startingBid: 100,
      startDate: "2098-01-01T12:00:00Z",
      endDate: "2099-01-01T12:00:00Z",
      rules: { bidIncrement: 10 },
    },
  },
  listing: {
    listingId: "property",
    ownerAccountId: "seller",
    basicInformation: {
      title: "Test property",
      type: "Residential",
      location: { address: "123 Main", city: "Houston" },
    },
    media: { images: [] },
    description: { overview: "Approved description" },
  },
  bid: { bidCount: 0 },
  preparationReadiness: ready,
} as unknown as AuctionOverview;
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(request).mockImplementation(async (url) => {
    if (url.endsWith("/launch"))
      return { auction: { ...row.auction, id: "auction", status: "scheduled", updatedAt: "v2" } };
    return ready;
  });
});
afterEach(cleanup);
async function review() {
  fireEvent.click(screen.getByRole("button", { name: /4 Review & launch/ }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Schedule Auction" })).toBeEnabled(),
  );
}
describe("auction preparation workflow", () => {
  it("launches a saved ready draft through the admin launch action and replaces its row", async () => {
    const replace = vi.fn();
    render(<AuctionPreparation row={row} onUpdate={vi.fn()} onReplace={replace} />);
    await review();
    fireEvent.click(screen.getByRole("button", { name: "Schedule Auction" }));
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(
        "/api/drafts/auctions/draft/launch",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ expectedUpdatedAt: "v1" }),
        }),
      ),
    );
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        "draft",
        expect.objectContaining({
          auction: expect.objectContaining({ id: "auction", status: "scheduled" }),
          auctionDraft: undefined,
        }),
      ),
    );
  });
  it("keeps failed readiness actionable without launching", async () => {
    vi.mocked(request).mockResolvedValue({
      ...ready,
      ready: false,
      checks: [
        { code: "authority_verified", label: "Seller authority verified", satisfied: false },
      ],
    });
    render(<AuctionPreparation row={row} onUpdate={vi.fn()} onReplace={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /4 Review & launch/ }));
    const blocker = await screen.findByRole("button", {
      name: /Seller authority verified Blocked/,
    });
    fireEvent.click(blocker);
    expect(screen.getByRole("heading", { name: "Verification", level: 2 })).toBeInTheDocument();
    expect(vi.mocked(request).mock.calls.some(([url]) => url.endsWith("/launch"))).toBe(false);
  });
  it("tracks clearing fields as unsaved and saves incomplete drafts without resurrecting old values", async () => {
    const update = vi.fn();
    vi.mocked(request).mockImplementation(async (url, init) =>
      init?.method === "PATCH"
        ? { ...row.auctionDraft, payload: JSON.parse(String(init.body)), updatedAt: "v2" }
        : ready,
    );
    render(<AuctionPreparation row={row} onUpdate={update} onReplace={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /3 Auction setup/ }));
    fireEvent.change(screen.getByRole("textbox", { name: "Opening bid" }), {
      target: { value: "" },
    });
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(update).toHaveBeenCalled());
    const saved = vi.mocked(request).mock.calls.find(([, init]) => init?.method === "PATCH");
    expect(JSON.parse(String(saved?.[1]?.body))).not.toHaveProperty("startingBid");
  });
  it("keeps server launch rejection on the checklist", async () => {
    vi.mocked(request).mockImplementation(async (url) => {
      if (url.endsWith("/launch"))
        throw Object.assign(new Error("Documents changed"), {
          details: {
            readiness: {
              ready: false,
              checks: [
                { code: "document:title", label: "Accepted title document", satisfied: false },
              ],
              blockers: [],
            },
          },
        });
      return ready;
    });
    render(<AuctionPreparation row={row} onUpdate={vi.fn()} onReplace={vi.fn()} />);
    await review();
    fireEvent.click(screen.getByRole("button", { name: "Schedule Auction" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Documents changed");
    expect(
      screen.getByRole("button", { name: /Accepted title document Blocked/ }),
    ).toBeInTheDocument();
  });
});
