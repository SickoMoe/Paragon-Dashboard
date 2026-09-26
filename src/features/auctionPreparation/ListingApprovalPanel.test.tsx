import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ListingApprovalPanel } from "./ListingApprovalPanel";
import { request } from "../../core/api/request";
vi.mock("../../core/api/request", () => ({ request: vi.fn() }));
const review = {
  listingId: "property",
  listingRevision: 3,
  draftUpdatedAt: "v1",
  reviewRequestId: null,
  reviewRevision: null,
  source: "current_property",
  hasPreviousApproval: true,
  snapshot: {
    basicInformation: {
      title: "Cape",
      type: "Residential",
      location: { address: "1 Main", city: "Houston", state: "TX", zipcode: "77001" },
    },
    media: { images: [] },
    termsAndConditions: "Auction terms",
  },
};
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(request).mockResolvedValue(review);
});
it("requires an intentional review and preserves version checks when approving inside preparation", async () => {
  const onApproved = vi.fn();
  render(
    <ListingApprovalPanel
      draftId="draft"
      onApproved={onApproved}
      onCancel={vi.fn()}
      onEdit={vi.fn()}
      onDirtyChange={vi.fn()}
    />,
  );
  await screen.findByText("Cape");
  const approve = screen.getByRole("button", { name: "Approve listing & return to checklist" });
  expect(approve).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox"));
  expect(approve).toBeEnabled();
  vi.mocked(request).mockResolvedValueOnce({
    listing: { listingId: "property" },
    draft: { id: "draft", updatedAt: "v2" },
  });
  fireEvent.click(approve);
  await waitFor(() => expect(onApproved).toHaveBeenCalled());
  expect(vi.mocked(request).mock.calls[1]).toEqual([
    "/api/drafts/auctions/draft/approve-listing",
    {
      method: "POST",
      body: JSON.stringify({
        listingRevision: 3,
        draftUpdatedAt: "v1",
        reviewRequestId: null,
        reviewRevision: null,
        termsAndConditions: "Auction terms",
      }),
    },
  ]);
});
it("keeps edits visible after failure and requires confirmation again when terms change", async () => {
  render(
    <ListingApprovalPanel
      draftId="draft"
      onApproved={vi.fn()}
      onCancel={vi.fn()}
      onEdit={vi.fn()}
      onDirtyChange={vi.fn()}
    />,
  );
  await screen.findByText("Cape");
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.change(screen.getByRole("textbox", { name: /Auction terms to approve/ }), {
    target: { value: "Updated terms" },
  });
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  fireEvent.click(screen.getByRole("checkbox"));
  vi.mocked(request).mockRejectedValueOnce(new Error("Property changed. Reload the review."));
  fireEvent.click(screen.getByRole("button", { name: "Approve listing & return to checklist" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Property changed");
  expect(screen.getByRole("textbox")).toHaveValue("Updated terms");
});
