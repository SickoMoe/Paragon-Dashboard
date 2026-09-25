import { useState } from "react";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import PropertyLocation, { type LocationRequest } from "./PropertyLocation";
import { enteredAddress, hasCoordinates, type PropertyLocation as Location } from "./location";
const initial: Location = {
  address: "212 Cape Conroe",
  city: "Montgomery",
  state: "TX",
  zipcode: "77356",
};
const place = {
  id: "1",
  label: "212 Cape Conroe",
  precision: "address",
  address: { street: "212 Cape Conroe", city: "Montgomery", state: "TX", zipcode: "77356" },
  center: { latitude: 30.39, longitude: -95.66 },
};
const request = vi.fn();
function Form({ value = initial }: { value?: Location }) {
  const [location, setLocation] = useState(value);
  return (
    <>
      <PropertyLocation
        value={location}
        onChange={setLocation}
        request={request as LocationRequest}
      />
      <output data-testid="location">{JSON.stringify(location)}</output>
    </>
  );
}
const saved = () => JSON.parse(screen.getByTestId("location").textContent!);
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  request.mockReset();
  request.mockResolvedValue({ matches: [place] });
});
afterEach(cleanup);
it("uses one address input, fills structured details, and records an automatic pin", async () => {
  render(<Form value={{ ...initial, address: "" }} />);
  fireEvent.change(screen.getByRole("searchbox", { name: "Property address" }), {
    target: { value: "212 Cape Conroe, Montgomery, TX 77356" },
  });
  fireEvent.click(await screen.findByRole("button", { name: /212 Cape Conroe Montgomery/ }));
  expect(saved()).toMatchObject({
    ...initial,
    latitude: 30.39,
    longitude: -95.66,
    coordinateSource: "geocoded",
  });
  expect(screen.getByText("Automatically located")).toBeInTheDocument();
});
it("keeps a manual pin through address edits until explicit replacement is selected", async () => {
  render(<Form value={{ ...initial, latitude: 30, longitude: -95, coordinateSource: "manual" }} />);
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "212 Cape Conroe Drive, Montgomery, TX 77356" },
  });
  fireEvent.click(await screen.findByRole("button", { name: /212 Cape Conroe Montgomery/ }));
  expect(saved()).toMatchObject({ latitude: 30, longitude: -95, coordinateSource: "manual" });
  expect(screen.getByText("Address changed. Update property location?")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Find automatically again" }));
  fireEvent.click(await screen.findByRole("button", { name: /212 Cape Conroe Montgomery/ }));
  expect(saved()).toMatchObject({
    latitude: 30.39,
    longitude: -95.66,
    coordinateSource: "geocoded",
  });
});
it("does not erase a valid human address when lookup fails", async () => {
  request.mockRejectedValue(new Error("Provider unavailable"));
  render(<Form />);
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "123 Main Street, Houston, TX 77001" },
  });
  await screen.findByText("Provider unavailable");
  expect(saved()).toMatchObject({
    address: "123 Main Street",
    city: "Houston",
    state: "TX",
    zipcode: "77001",
  });
  expect(hasCoordinates(saved())).toBe(false);
  expect(screen.getByText("Location not mapped")).toBeInTheDocument();
});
it("requires pin confirmation and reverse suggestions never replace the street", async () => {
  request.mockResolvedValue({
    location: {
      address: { street: "Different street", city: "New city", state: "TX", zipcode: "77355" },
    },
  });
  render(
    <Form value={{ ...initial, latitude: 30, longitude: -95, coordinateSource: "geocoded" }} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Adjust pin" }));
  expect(saved().coordinateSource).toBe("geocoded");
  fireEvent.click(screen.getByRole("button", { name: "Confirm property location" }));
  await waitFor(() => expect(saved().coordinateSource).toBe("manual"));
  fireEvent.click(await screen.findByRole("button", { name: "Use these area details" }));
  expect(saved()).toMatchObject({
    address: initial.address,
    city: "New city",
    state: "TX",
    zipcode: "77355",
    latitude: 30,
    longitude: -95,
    coordinateSource: "manual",
  });
});
it("cancelled adjustment and explicit pin removal have distinct effects", () => {
  render(<Form value={{ ...initial, latitude: 30, longitude: -95, coordinateSource: "manual" }} />);
  fireEvent.click(screen.getByRole("button", { name: "Adjust pin" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel adjustment" }));
  expect(saved().latitude).toBe(30);
  fireEvent.click(screen.getByRole("button", { name: "Remove map pin" }));
  expect(saved()).toEqual(initial);
});
it("parses explicit full addresses and accepts valid zero coordinates", () => {
  expect(enteredAddress("123 Main St, Houston, TX 77001", initial)).toEqual({
    address: "123 Main St",
    city: "Houston",
    state: "TX",
    zipcode: "77001",
  });
  expect(hasCoordinates({ latitude: 0, longitude: 0 })).toBe(true);
  expect(hasCoordinates({ latitude: 10, longitude: undefined })).toBe(false);
});

it("does not mistake state and ZIP for the city when the city is omitted", () => {
  expect(enteredAddress("212 Cape Conroe Drive, TX 77356", initial)).toEqual({
    ...initial,
    address: "212 Cape Conroe Drive",
  });
});
