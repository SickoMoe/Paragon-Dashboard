import { useState } from "react";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ListingEditorSection } from "./ListingEditorSection";
import ListingCreation from "./ListingCreation";
import ListingPhotos from "./ListingPhotos";
import AddressSearch from "./AddressSearch";
import {
  changedListingPatch,
  createBlankListingForm,
  listingFormToCreateInput,
  listingToForm,
  validateForm,
} from "./listingForm";
import { request } from "../../core/api/request";
import type { IListing } from "../../interfaces/IListing";
vi.mock("../../core/api/request", () => ({ request: vi.fn() }));
const listing = () =>
  ({
    ...listingFormToCreateInput({
      ...createBlankListingForm(),
      title: "Oak house",
      address: "1 Oak Ave",
      city: "Austin",
      state: "TX",
      zipcode: "78701",
      latitude: "30",
      longitude: "-97",
      overview: "Keep me",
      images: "/one.jpg\n/two.jpg",
      thumbnailUrl: "/one.jpg",
    }),
    listingId: "L1",
    ownerAccountId: "seller",
    revision: 3,
    tags: { custom: "Stay" },
  }) as IListing;
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(request).mockResolvedValue(listing());
});
afterEach(cleanup);
it("sends only changed nested fields and explicit coordinate clears", () => {
  const original = listingToForm(listing());
  expect(
    changedListingPatch(
      { ...original, address: "2 Oak Ave", latitude: "", longitude: "" },
      original,
    ),
  ).toEqual({
    basicInformation: { location: { address: "2 Oak Ave", latitude: null, longitude: null } },
  });
  expect(changedListingPatch(original, original)).toEqual({});
  expect(
    validateForm({ ...original, zipcode: "old legacy zip", title: "New" }, false, {
      ...original,
      zipcode: "old legacy zip",
    }),
  ).toEqual({});
});
it("keeps failed edits, retries the minimal patch, and reports the saved state", async () => {
  let attempts = 0;
  vi.mocked(request).mockImplementation(async (_url, init) => {
    if (init?.method === "PATCH") {
      if (!attempts++) throw new Error("Connection failed");
      return {
        ...listing(),
        revision: 4,
        basicInformation: {
          ...listing().basicInformation,
          location: {
            ...listing().basicInformation.location,
            address: "2 Oak Ave",
            latitude: undefined,
            longitude: undefined,
          },
        },
      };
    }
    return listing();
  });
  const update = vi.fn();
  render(<ListingEditorSection listing={listing()} onUpdated={update} />);
  fireEvent.click(await screen.findByText("Edit address details"));
  fireEvent.change(await screen.findByRole("textbox", { name: "Street address" }), {
    target: { value: "2 Oak Ave" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save property changes" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Connection failed");
  expect(screen.getByRole("textbox", { name: "Street address" })).toHaveValue("2 Oak Ave");
  fireEvent.click(screen.getByRole("button", { name: "Save property changes" }));
  await waitFor(() => expect(update).toHaveBeenCalled());
  const call = vi.mocked(request).mock.calls.find(([, init]) => init?.method === "PATCH");
  expect(JSON.parse(String(call?.[1]?.body))).toEqual({
    expectedRevision: 3,
    basicInformation: { location: { address: "2 Oak Ave", latitude: 30, longitude: -97 } },
  });
  expect(screen.getByText("Saved", { exact: true })).toBeInTheDocument();
});
it("blocks editing stale snapshot data when the managed listing cannot be loaded", async () => {
  vi.mocked(request).mockRejectedValue(new Error("Unavailable"));
  render(<ListingEditorSection listing={listing()} onUpdated={vi.fn()} />);
  expect(await screen.findByRole("button", { name: "Retry loading property" })).toBeInTheDocument();
  expect(screen.queryByRole("textbox", { name: "Listing title" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Save property changes" })).toBeDisabled();
});
it("requires explicit correction review before saving an active auction property", async () => {
  vi.mocked(request).mockImplementation(async (_url, init) => {
    if (init?.method === "PATCH" && !JSON.parse(String(init.body)).correctionReason)
      throw Object.assign(new Error("Review required"), {
        details: {
          code: "auction_correction_required",
          affectedAuctions: [{ id: "A1", status: "live" }],
        },
      });
    return listing();
  });
  render(<ListingEditorSection listing={listing()} onUpdated={vi.fn()} />);
  fireEvent.change(await screen.findByRole("textbox", { name: "Listing title" }), {
    target: { value: "Corrected title" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save property changes" }));
  const confirm = await screen.findByRole("button", { name: "Confirm correction & save" });
  expect(confirm).toBeDisabled();
  fireEvent.change(screen.getByRole("textbox", { name: "Correction reason" }), {
    target: { value: "Typo correction" },
  });
  fireEvent.click(confirm);
  await waitFor(() =>
    expect(vi.mocked(request).mock.calls.filter(([, i]) => i?.method === "PATCH")).toHaveLength(2),
  );
  expect(JSON.parse(String(vi.mocked(request).mock.calls.slice(-1)[0]?.[1]?.body))).toMatchObject({
    correctionReason: "Typo correction",
  });
});
it("saves an incomplete draft, restores it on reopen, and does not create a second listing", async () => {
  let stored: IListing;
  vi.mocked(request).mockImplementation(async (_url, init) => {
    if (init?.method === "POST") {
      stored = {
        ...JSON.parse(String(init.body)),
        listingId: "D1",
        ownerAccountId: "admin",
        revision: 1,
      };
      return stored;
    }
    return stored;
  });
  const dirty = vi.fn();
  const first = render(<ListingCreation onCreated={vi.fn()} onDirtyChange={dirty} />);
  fireEvent.change(await screen.findByRole("textbox", { name: "Street address" }), {
    target: { value: "Unfinished street" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await screen.findByText("Draft saved", { exact: true });
  expect(dirty).toHaveBeenLastCalledWith(false);
  first.unmount();
  render(<ListingCreation onCreated={vi.fn()} />);
  expect(await screen.findByRole("textbox", { name: "Street address" })).toHaveValue(
    "Unfinished street",
  );
  expect(screen.getByRole("textbox", { name: "Listing title" })).toHaveValue("");
  expect(vi.mocked(request).mock.calls.filter(([, i]) => i?.method === "POST")).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "Photos" }));
  expect(screen.getByLabelText("Upload property photos")).toBeInTheDocument();
});
function Photos() {
  const [form, setForm] = useState(listingToForm(listing()));
  return (
    <>
      <ListingPhotos form={form} setForm={setForm} />
      <output data-testid="form">{JSON.stringify(form)}</output>
    </>
  );
}
it("visually reorders photos, chooses the cover, and removes the current cover", () => {
  render(<Photos />);
  fireEvent.click(screen.getByRole("button", { name: "Move photo 2 earlier" }));
  expect(JSON.parse(screen.getByTestId("form").textContent!).images).toBe("/two.jpg\n/one.jpg");
  fireEvent.click(
    within(screen.getAllByRole("article")[0]).getByRole("button", { name: "Set as cover" }),
  );
  expect(JSON.parse(screen.getByTestId("form").textContent!).thumbnailUrl).toBe("/two.jpg");
  fireEvent.click(screen.getByRole("button", { name: "Remove photo 1" }));
  expect(JSON.parse(screen.getByTestId("form").textContent!).thumbnailUrl).toBe("/one.jpg");
});
it("rejects unsupported image files without sending an upload", () => {
  render(<Photos />);
  fireEvent.change(screen.getByLabelText("Upload property photos"), {
    target: { files: [new File(["x"], "file.txt", { type: "text/plain" })] },
  });
  expect(screen.getByRole("alert")).toHaveTextContent("choose JPG, PNG, or WebP");
});
function Address() {
  const [form, setForm] = useState(listingToForm(listing()));
  return (
    <>
      <AddressSearch form={form} setForm={setForm} />
      <output data-testid="form">{JSON.stringify(form)}</output>
    </>
  );
}
it("keeps a property address intact when a suggestion only identifies an area", async () => {
  vi.mocked(request).mockResolvedValue({
    matches: [
      {
        id: "area",
        label: "Houston, TX",
        description: "Area",
        precision: "area",
        address: { street: "", city: "Houston", state: "TX", zipcode: "" },
        center: { latitude: 29, longitude: -95 },
      },
    ],
  });
  render(<Address />);
  fireEvent.click(screen.getByRole("button", { name: "Find automatically again" }));
  fireEvent.click(await screen.findByRole("button", { name: /Houston, TX/ }));
  expect(JSON.parse(screen.getByTestId("form").textContent!)).toMatchObject({
    address: "1 Oak Ave",
    city: "Austin",
    state: "TX",
    zipcode: "78701",
    latitude: "30",
    longitude: "-97",
  });
  expect(screen.getByText(/This identifies an area, not the property/)).toBeInTheDocument();
});
