import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { request } from "../../core/api/request";
import { AssetsPage, AssetWorkspace, OpportunityWorkspace } from "./PortfolioPages";
import { AssetForm, OpportunityForm } from "./AssetForms";
import type { Asset, Opportunity } from "./types";
vi.mock("../../core/api/request", () => ({ request: vi.fn() }));
vi.mock("../listingEditor/ListingPhotos", () => ({
  default: () => <div>Shared photo controls</div>,
}));
const asset = () =>
  ({
    assetId: "a",
    title: "Oak House",
    assetType: "Residential",
    location: { address: "1 Oak St", city: "Austin", state: "TX", zipcode: "78701" },
    parcel: "APN-100",
    status: "active",
    revision: 1,
    notes: "Private property note",
    description: "",
    primaryImage: "",
    media: { images: [] },
    characteristics: {
      bedrooms: 3,
      bathrooms: 2,
      buildingSQFT: "2000",
      lotSize: "1 acre",
      yearBuilt: 2000,
      amenities: [],
    },
    relationships: [],
    opportunities: [],
    activity: [],
    updatedAt: "2026-09-01",
    people: [],
  }) as unknown as Asset;
const opportunity = () =>
  ({
    opportunityId: "o",
    assetId: "a",
    type: "liquidation",
    status: "structuring",
    title: "Sell Oak",
    description: "",
    priority: "normal",
    assignedAccountId: null,
    estimatedValue: null,
    targetValue: null,
    notes: "Internal sale strategy",
    source: "",
    currency: "USD",
    revision: 2,
    activity: [],
    listingId: null,
    summary: {
      phase: "preparation",
      nextAction: "Create sale listing",
      listing: null,
      auctions: [],
      auctionDrafts: [],
      transactions: [],
    },
    asset: asset(),
    people: [],
  }) as unknown as Opportunity;
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
it("filters the asset list by parcel and opportunity, including assets without opportunities", async () => {
  const a = asset(),
    other = {
      ...asset(),
      assetId: "b",
      title: "Other house",
      parcel: "APN-200",
      opportunities: [opportunity()],
    };
  vi.mocked(request).mockResolvedValue([a, other]);
  render(
    <MemoryRouter>
      <AssetsPage />
    </MemoryRouter>,
  );
  expect(await screen.findByRole("link", { name: "Oak House" })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Find property"), { target: { value: "APN-100" } });
  expect(screen.queryByRole("link", { name: "Other house" })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Find property"), { target: { value: "" } });
  fireEvent.change(screen.getByLabelText("Opportunity type"), { target: { value: "liquidation" } });
  expect(screen.queryByRole("link", { name: "Oak House" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Other house" })).toBeInTheDocument();
});
it("uses shared location and media controls, allows saving without coordinates, and keeps duplicate choices reviewable", async () => {
  const save = vi
    .fn()
    .mockRejectedValueOnce(
      Object.assign(new Error("Probable existing property"), {
        details: { candidates: [asset()] },
      }),
    )
    .mockResolvedValue(undefined);
  render(
    <MemoryRouter>
      <AssetForm onSave={save} onCancel={() => {}} />
    </MemoryRouter>,
  );
  expect(screen.getByLabelText("Property address")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Property name"), { target: { value: "Oak House" } });
  fireEvent.click(screen.getByRole("button", { name: "Create asset" }));
  expect(await screen.findByRole("link", { name: "Oak House" })).toHaveAttribute(
    "href",
    "/assets/a",
  );
  fireEvent.change(screen.getByLabelText("Reason these are distinct properties"), {
    target: { value: "Different unit" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create asset" }));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
  expect(save.mock.calls[1][0]).toMatchObject({
    distinctReason: "Different unit",
    location: { address: "" },
  });
  fireEvent.click(screen.getAllByRole("button", { name: "Details & photos" })[0]);
  expect(screen.getByText("Shared photo controls")).toBeInTheDocument();
});
it("retains the authenticated revision and acquisition assumptions when editing", async () => {
  const o = {
    ...opportunity(),
    type: "acquisition",
    listingId: null,
    askingPrice: 250000,
    targetAcquisitionPrice: 220000,
    strategyNotes: "Existing strategy",
  };
  const save = vi.fn().mockResolvedValue(undefined);
  render(
    <MemoryRouter>
      <OpportunityForm asset={asset()} opportunity={o} onSave={save} onCancel={() => {}} />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByLabelText("Target acquisition price (USD)"), {
    target: { value: "210000" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save opportunity" }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        revision: 2,
        targetAcquisitionPrice: 210000,
        strategyNotes: "Existing strategy",
      }),
    ),
  );
});
it("creates a listing from the selected opportunity and opens its existing editor", async () => {
  vi.mocked(request).mockImplementation(async (_url, init) =>
    init?.method === "POST" ? { listingId: "new-listing" } : opportunity(),
  );
  render(
    <MemoryRouter initialEntries={["/opportunities/o"]}>
      <Routes>
        <Route path="/opportunities/:opportunityId" element={<OpportunityWorkspace />} />
        <Route path="/listings/:listingId" element={<h1>Existing listing editor</h1>} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.click(await screen.findByRole("button", { name: "Create listing from asset" }));
  expect(
    await screen.findByRole("heading", { name: "Existing listing editor" }),
  ).toBeInTheDocument();
  expect(request).toHaveBeenCalledWith("/api/admin/portfolio/opportunities/o/listing", {
    method: "POST",
  });
});
it("shows completed closing links while keeping Asset identity and opportunity status distinct", async () => {
  const o = opportunity();
  o.summary = {
    ...o.summary,
    phase: "completed",
    nextAction: "Review completed sale / mark asset sold",
    listing: {
      listingId: "l",
      title: "Approved Oak",
      status: "completed",
      moderationStatus: "approved",
      location: asset().location,
    },
    transactions: [
      {
        transactionId: "t",
        status: "completed",
        winningAmount: 300000,
        currency: "USD",
        property: { title: "Historical Oak", address: "Old address" },
        completedAt: "2026-08-01",
      },
    ],
  };
  vi.mocked(request).mockResolvedValue(o);
  render(
    <MemoryRouter initialEntries={["/opportunities/o"]}>
      <Routes>
        <Route path="/opportunities/:opportunityId" element={<OpportunityWorkspace />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByText("Historical Oak · Old address")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Approved Oak" })).toHaveAttribute("href", "/listings/l");
  expect(screen.getByRole("link", { name: "Completed · $300,000" })).toHaveAttribute(
    "href",
    "/transactions/t",
  );
  expect(screen.getByText("Structuring")).toBeInTheDocument();
});
it("keeps open and historical opportunities accessible from an Asset", async () => {
  const a = asset();
  a.opportunities = [
    opportunity(),
    { ...opportunity(), opportunityId: "old", title: "Past evaluation", status: "rejected" },
  ];
  vi.mocked(request).mockResolvedValue(a);
  render(
    <MemoryRouter initialEntries={["/assets/a"]}>
      <Routes>
        <Route path="/assets/:assetId" element={<AssetWorkspace />} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.click(await screen.findByRole("button", { name: "Opportunities" }));
  expect(screen.getByRole("link", { name: "Past evaluation" })).toHaveAttribute(
    "href",
    "/opportunities/old",
  );
  expect(screen.getByRole("link", { name: "Sell Oak" })).toHaveAttribute(
    "href",
    "/opportunities/o",
  );
});
