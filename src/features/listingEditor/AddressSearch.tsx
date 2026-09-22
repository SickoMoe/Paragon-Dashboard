import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { request } from "../../core/api/request";
import type { ListingFormState } from "./listingForm";
type Place = {
  id: string;
  label: string;
  description: string;
  address: { street: string; city: string; state: string; zipcode: string };
  precision: "address" | "street" | "area";
  center: { latitude: number; longitude: number };
};
export default function AddressSearch({
  form,
  setForm,
  disabled,
}: {
  form: ListingFormState;
  setForm: Dispatch<SetStateAction<ListingFormState>>;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Place[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const active = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  async function search(value: string, signal: AbortSignal, id: number) {
    setBusy(true);
    setMessage("");
    try {
      const data = await request<{ matches: Place[] }>(
        `/api/locations/search?q=${encodeURIComponent(value)}`,
        { signal },
      );
      if (id !== sequence.current) return;
      setMatches(data.matches);
      if (!data.matches.length)
        setMessage(
          "No address found. Your entered address is kept; map coordinates are unavailable.",
        );
    } catch (e) {
      if (!signal.aborted && id === sequence.current)
        setMessage(
          e instanceof Error ? e.message : "Address lookup is unavailable. Your address is kept.",
        );
    } finally {
      if (id === sequence.current) setBusy(false);
    }
  }
  useEffect(() => {
    const id = ++sequence.current;
    active.current?.abort();
    setMatches([]);
    setBusy(false);
    if (query.trim().length < 3) return;
    const controller = new AbortController();
    active.current = controller;
    const timer = window.setTimeout(() => void search(query, controller.signal, id), 650);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  function refresh() {
    active.current?.abort();
    const id = ++sequence.current;
    const controller = new AbortController();
    active.current = controller;
    setMatches([]);
    setForm((f) => ({ ...f, latitude: "", longitude: "" }));
    void search(
      [form.address, form.city, form.state, form.zipcode].filter(Boolean).join(", "),
      controller.signal,
      id,
    );
  }
  function select(place: Place) {
    active.current?.abort();
    sequence.current++;
    setBusy(false);
    setQuery("");
    setMatches([]);
    const precise = place.precision === "address";
    setForm((f) => ({
      ...f,
      address: place.address.street,
      city: place.address.city,
      state: place.address.state,
      zipcode: place.address.zipcode,
      latitude: precise ? String(place.center.latitude) : "",
      longitude: precise ? String(place.center.longitude) : "",
    }));
    setMessage(
      precise
        ? "Address and property coordinates populated. Review the fields below."
        : "Area details populated. This is not an exact property address, so no map pin was assigned.",
    );
  }
  useEffect(
    () => () => {
      active.current?.abort();
    },
    [],
  );
  return (
    <div className="listing-address">
      <label>
        Find the property address
        <input
          disabled={disabled}
          type="search"
          value={query}
          placeholder="Start typing a street address…"
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {busy ? <p role="status">Finding addresses…</p> : null}
      {matches.length ? (
        <ul aria-label="Address suggestions">
          {matches.map((place) => (
            <li key={place.id}>
              <button type="button" onClick={() => select(place)} disabled={disabled}>
                <strong>{place.label}</strong>
                <small>
                  {place.description}
                  {place.precision !== "address" ? " · Area only" : ""}
                </small>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {message ? <p role="status">{message}</p> : null}
      <div className="listing-address__status">
        <span>
          {form.latitude && form.longitude ? "Property coordinates set" : "No property coordinates"}
        </span>
        <button type="button" disabled={disabled || busy || !form.address.trim()} onClick={refresh}>
          Find coordinates for entered address
        </button>
      </div>
      <small>
        Address data: OpenStreetMap / Photon. Only an address-level match assigns property
        coordinates.
      </small>
    </div>
  );
}
