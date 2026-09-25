export type PropertyLocation = {
  address: string;
  city: string;
  state: string;
  zipcode: string;
  latitude?: number;
  longitude?: number;
  coordinateSource?: "manual" | "geocoded";
};
export type Place = {
  id: string;
  label: string;
  description: string;
  precision: "address" | "street" | "area";
  address: { street: string; city: string; state: string; zipcode: string };
  center: { latitude: number; longitude: number };
  provider?: string;
};
export const displayAddress = (p: PropertyLocation) =>
  [p.address, p.city, [p.state, p.zipcode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
export const hasCoordinates = (p: Partial<PropertyLocation>) =>
  typeof p.latitude === "number" &&
  Number.isFinite(p.latitude) &&
  Math.abs(p.latitude) <= 90 &&
  typeof p.longitude === "number" &&
  Number.isFinite(p.longitude) &&
  Math.abs(p.longitude) <= 180;
// Parse only explicit address parts; lookup/secondary fields handle ambiguous input.
export function enteredAddress(text: string, current: PropertyLocation): PropertyLocation {
  const parts = text.split(",").map((p) => p.trim());
  if (parts.length < 2) return { ...current, address: text };
  const tail = parts[parts.length - 1].match(/^([a-z]{2})(?:\s+(\d{5}(?:-\d{4})?))?$/i);
  return {
    ...current,
    address: parts[0],
    city: tail
      ? parts.length >= 3
        ? parts.slice(1, -1).join(", ")
        : current.city
      : parts.slice(1).join(", "),
    state: tail ? tail[1].toUpperCase() : current.state,
    zipcode: tail?.[2] || current.zipcode,
  };
}
