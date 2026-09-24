import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  displayAddress,
  enteredAddress,
  hasCoordinates,
  type Place,
  type PropertyLocation as Location,
} from "./location";
import "./propertyLocation.css";
export type LocationRequest = <T>(url: string, options?: RequestInit) => Promise<T>;
export default function PropertyLocation({
  value,
  onChange,
  request,
  disabled = false,
  errors = {},
}: {
  value: Location;
  onChange: (location: Location) => void;
  request: LocationRequest;
  disabled?: boolean;
  errors?: Partial<Record<keyof Location, string>>;
}) {
  const [query, setQuery] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [matches, setMatches] = useState<Place[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingPin, setEditingPin] = useState(false);
  const [candidate, setCandidate] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [addressChanged, setAddressChanged] = useState(false);
  const [replaceManual, setReplaceManual] = useState(false);
  const [reverse, setReverse] = useState<Place["address"] | null>(null);
  const latest = useRef({ value, request, onChange });
  latest.current = { value, request, onChange };
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const mapped = hasCoordinates(value);
  useEffect(() => {
    setMatches([]);
    setBusy(false);
    if (query === null || query.trim().length < 3 || disabled) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setBusy(true);
      setMessage("");
      try {
        const result = await latest.current.request<{ matches: Place[] }>(
          "/api/locations/property",
          {
            method: "POST",
            body: JSON.stringify({ query, location: latest.current.value }),
            signal: controller.signal,
          },
        );
        if (!controller.signal.aborted) {
          setMatches(result.matches);
          if (!result.matches.some((p) => p.precision === "address"))
            setMessage(
              "No exact property match. You can keep this address and set its location on the map.",
            );
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setMessage(
            error instanceof Error
              ? error.message
              : "Address lookup unavailable. You can set the location on the map.",
          );
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }, 650);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, disabled, attempt]);
  function changeAddress(next: Location) {
    if (displayAddress(next) !== displayAddress(value) && mapped) setAddressChanged(true);
    onChange(next);
  }
  function automatic() {
    setAttempt((n) => n + 1);
    setReplaceManual(true);
    setEditingPin(false);
    setCandidate(null);
    setQuery(displayAddress(value));
    setMessage("Choose a matching address to update the property location.");
  }
  function select(place: Place) {
    setQuery(null);
    setMatches([]);
    if (place.precision !== "address") {
      setMapCenter(place.center);
      setCandidate(mapped ? { latitude: value.latitude!, longitude: value.longitude! } : null);
      setEditingPin(true);
      setMessage(
        "This identifies an area, not the property. Click the property on the map and confirm the pin.",
      );
      return;
    }
    const next: Location = {
      ...value,
      address: place.address.street,
      city: place.address.city,
      state: place.address.state,
      zipcode: place.address.zipcode,
    };
    if (mapped && value.coordinateSource === "manual" && !replaceManual) {
      changeAddress(next);
      setAddressChanged(true);
      setMessage(
        "Address selected. Your manually positioned pin is kept until you choose to update it.",
      );
      return;
    }
    onChange({ ...next, ...place.center, coordinateSource: "geocoded" });
    setMapCenter(place.center);
    setAddressChanged(false);
    setReplaceManual(false);
    setEditingPin(false);
    setMessage("Address located. Review the map pin.");
  }
  function adjust() {
    setQuery(null);
    setReverse(null);
    setCandidate(mapped ? { latitude: value.latitude!, longitude: value.longitude! } : null);
    setEditingPin(true);
  }
  async function confirmPin() {
    if (!candidate) return;
    const pin = candidate;
    onChange({ ...value, ...pin, coordinateSource: "manual" });
    setAddressChanged(false);
    setEditingPin(false);
    setMessage("Property location confirmed.");
    setReverse(null);
    try {
      const result = await request<{ location: Place | null }>(
        `/api/locations/reverse?lat=${pin.latitude}&lon=${pin.longitude}&zoom=17`,
      );
      const now = latest.current.value;
      if (mounted.current && now.latitude === pin.latitude && now.longitude === pin.longitude)
        setReverse(result.location?.address || null);
    } catch {
      /* The confirmed pin never depends on reverse lookup. */
    }
  }
  return (
    <section className="property-location" aria-label="Property location">
      <label className="property-location__primary">
        Property address
        <input
          type="search"
          autoComplete="off"
          placeholder="Street address, city, state or ZIP"
          value={query ?? displayAddress(value)}
          disabled={disabled}
          aria-invalid={Boolean(errors.address)}
          onChange={(event) => {
            const text = event.target.value;
            setQuery(text);
            setReplaceManual(false);
            changeAddress(enteredAddress(text, value));
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
            if (event.key === "Escape") {
              setQuery(null);
              setMatches([]);
            }
          }}
        />
      </label>
      {busy && <p role="status">Finding addresses…</p>}
      {matches.length > 0 && (
        <ul className="property-location__suggestions" aria-label="Address suggestions">
          {matches.map((place) => (
            <li key={place.id}>
              <button type="button" disabled={disabled} onClick={() => select(place)}>
                <strong>{place.address.street || place.label}</strong>
                <span>
                  {[place.address.city, place.address.state, place.address.zipcode]
                    .filter(Boolean)
                    .join(", ") || place.description}
                </span>
                {place.precision !== "address" && (
                  <small>Area only · Set the property pin on the map</small>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {message && <p role="status">{message}</p>}
      <details open={Object.values(errors).some(Boolean) || undefined}>
        <summary>Edit address details</summary>
        <div className="property-location__details">
          {(["address", "city", "state", "zipcode"] as const).map((key, i) => (
            <label key={key}>
              {["Street address", "City", "State", "ZIP code"][i]}
              <input
                id={`listing-field-basicInformation-location-${key}`}
                value={value[key]}
                disabled={disabled}
                aria-invalid={Boolean(errors[key])}
                onChange={(e) => {
                  setQuery(null);
                  changeAddress({ ...value, [key]: e.target.value });
                }}
              />
              {errors[key] && <small role="alert">{errors[key]}</small>}
            </label>
          ))}
        </div>
      </details>
      <div className="property-location__status">
        <strong>
          {mapped
            ? value.coordinateSource === "manual"
              ? "Manually positioned"
              : value.coordinateSource === "geocoded"
                ? "Automatically located"
                : "Location mapped"
            : "Location not mapped"}
        </strong>
        <span>{displayAddress(value)}</span>
      </div>
      {addressChanged && mapped && (
        <div className="property-location__notice">
          <strong>Address changed. Update property location?</strong>
          <p>The current pin is kept until you choose a new location.</p>
          <div className="property-location__actions">
            <button type="button" disabled={disabled} onClick={automatic}>
              Find automatically
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                onChange({ ...value, coordinateSource: "manual" });
                setQuery(null);
                setAddressChanged(false);
                setMessage("Current pin kept.");
              }}
            >
              Keep current pin
            </button>
            <button type="button" disabled={disabled} onClick={adjust}>
              Adjust manually
            </button>
          </div>
        </div>
      )}
      {(mapped || editingPin) && (
        <LocationMap
          position={
            editingPin
              ? candidate
              : mapped
                ? { latitude: value.latitude!, longitude: value.longitude! }
                : null
          }
          center={mapCenter}
          editable={editingPin && !disabled}
          onPosition={setCandidate}
        />
      )}
      {editingPin ? (
        <>
          <p>
            Pan or zoom, then click the property or drag the pin. Confirm when it is in the right
            place.
          </p>
          <div className="property-location__actions">
            <button
              type="button"
              disabled={disabled || !candidate}
              onClick={() => void confirmPin()}
            >
              Confirm property location
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setCandidate(
                  mapped ? { latitude: value.latitude!, longitude: value.longitude! } : null,
                );
                setMapCenter(null);
              }}
            >
              Reset pin
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingPin(false);
                setCandidate(null);
              }}
            >
              Cancel adjustment
            </button>
          </div>
        </>
      ) : null}
      <div className="property-location__actions">
        <button type="button" disabled={disabled} onClick={adjust}>
          {mapped ? "Adjust pin" : "Set location on map"}
        </button>
        <button
          type="button"
          disabled={disabled || busy || !value.address.trim()}
          onClick={automatic}
        >
          {mapped ? "Find automatically again" : "Find automatically"}
        </button>
        {mapped && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onChange({
                ...value,
                latitude: undefined,
                longitude: undefined,
                coordinateSource: undefined,
              });
              setAddressChanged(false);
              setEditingPin(false);
              setReverse(null);
            }}
          >
            Remove map pin
          </button>
        )}
      </div>
      {reverse && [reverse.city, reverse.state, reverse.zipcode].some(Boolean) && (
        <div className="property-location__notice">
          <p>
            Area near your pin:{" "}
            {[reverse.city, reverse.state, reverse.zipcode].filter(Boolean).join(", ")}
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onChange({
                ...value,
                city: reverse.city || value.city,
                state: reverse.state || value.state,
                zipcode: reverse.zipcode || value.zipcode,
              });
              setQuery(null);
              setReverse(null);
            }}
          >
            Use these area details
          </button>
          <button type="button" onClick={() => setReverse(null)}>
            Dismiss
          </button>
        </div>
      )}
      {!mapped && (
        <small>
          The address can be saved without a pin. Add a location to include this property in map
          results.
        </small>
      )}
    </section>
  );
}
function LocationMap({
  position,
  center,
  editable,
  onPosition,
}: {
  position: { latitude: number; longitude: number } | null;
  center: { latitude: number; longitude: number } | null;
  editable: boolean;
  onPosition: (p: { latitude: number; longitude: number }) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const latest = useRef({ editable, onPosition });
  latest.current = { editable, onPosition };
  useEffect(() => {
    if (!container.current) return;
    const map = L.map(container.current, { scrollWheelZoom: false }).setView([39.5, -98.35], 4);
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    map.on("click", (event: L.LeafletMouseEvent) => {
      if (latest.current.editable)
        latest.current.onPosition({
          latitude: Number(event.latlng.lat.toFixed(6)),
          longitude: Number(event.latlng.wrap().lng.toFixed(6)),
        });
    });
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);
  const lat = position?.latitude,
    lon = position?.longitude;
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (lat == null || lon == null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      const marker = L.marker([lat, lon], {
        draggable: editable,
        icon: L.divIcon({
          className: "property-location__pin",
          html: "<span></span>",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
        title: "Property location",
        keyboard: true,
      }).addTo(map);
      marker.on("dragend", () => {
        const p = marker.getLatLng().wrap();
        latest.current.onPosition({
          latitude: Number(p.lat.toFixed(6)),
          longitude: Number(p.lng.toFixed(6)),
        });
      });
      markerRef.current = marker;
      map.setView([lat, lon], 17);
    } else markerRef.current.setLatLng([lat, lon]);
    if (!map.getBounds().contains([lat, lon])) map.panTo([lat, lon]);
    if (editable) markerRef.current.dragging?.enable();
    else markerRef.current.dragging?.disable();
  }, [lat, lon, editable]);
  useEffect(() => {
    if (center) mapRef.current?.setView([center.latitude, center.longitude], 15);
  }, [center]);
  return (
    <div
      ref={container}
      className="property-location__map"
      aria-label={editable ? "Choose the property location on the map" : "Property location map"}
    />
  );
}
