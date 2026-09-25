import { useState } from "react";
import { Link } from "react-router-dom";
import PropertyLocation from "../../components/propertyLocation/PropertyLocation";
import { request } from "../../core/api/request";
import ListingPhotos from "../listingEditor/ListingPhotos";
import { createBlankListingForm } from "../listingEditor/listingForm";
import {
  type Asset,
  type Opportunity,
  type Person,
  label,
  assetStatuses,
  opportunityTypes,
  opportunityStatuses,
} from "./types";
export function Choices({
  label: title,
  value,
  onChange,
  options,
  empty,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  empty?: string;
}) {
  return (
    <label>
      {title}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {empty && <option value="">{empty}</option>}
        {options.map((v) => (
          <option key={v} value={v}>
            {label(v)}
          </option>
        ))}
      </select>
    </label>
  );
}
export function Text({
  title,
  value,
  onChange,
  multiline = false,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label>
      {title}
      {multiline ? (
        <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}
export function Amount({
  title,
  value,
  onChange,
}: {
  title: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <label>
      {title}
      <input
        type="number"
        min="0"
        step="any"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
    </label>
  );
}
export function AssetForm({
  asset,
  people = [],
  onSave,
  onCancel,
}: {
  asset?: Asset;
  people?: Person[];
  onSave: (input: Partial<Asset> & { distinctReason?: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(
    () =>
      asset ||
      ({
        title: "",
        assetType: "Residential",
        location: { address: "", city: "", state: "", zipcode: "" },
        parcel: "",
        description: "",
        primaryImage: "",
        media: { images: [] },
        characteristics: {
          bedrooms: 0,
          bathrooms: 0,
          buildingSQFT: "",
          lotSize: "",
          yearBuilt: 0,
          amenities: [],
        },
        relationships: [],
        status: "active",
        notes: "",
      } as unknown as Asset),
  );
  const [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [pending, setPending] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState(""),
    [candidates, setCandidates] = useState<Asset[]>([]),
    [reason, setReason] = useState("");
  const update = <K extends keyof Asset>(key: K, value: Asset[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  async function save() {
    if (pending || uploading || busy) return;
    setBusy(true);
    setError("");
    try {
      await onSave({
        title: form.title,
        assetType: form.assetType,
        location: form.location,
        parcel: form.parcel,
        description: form.description,
        primaryImage: form.primaryImage,
        media: form.media,
        characteristics: form.characteristics,
        relationships: form.relationships,
        status: form.status,
        notes: form.notes,
        revision: form.revision,
        distinctReason: reason,
      });
    } catch (e) {
      setError((e as Error).message);
      setCandidates((e as { details?: { candidates?: Asset[] } }).details?.candidates || []);
    } finally {
      setBusy(false);
    }
  }
  const photos = {
    ...createBlankListingForm(),
    images: form.media.images.join("\n"),
    thumbnailUrl: form.primaryImage,
  };
  return (
    <section className="portfolio-panel">
      <header>
        <h2>{asset ? "Edit current asset" : "Add a property asset"}</h2>
        <p>
          Current property information. Listing approvals, auction terms, and completed sale records
          remain unchanged.
        </p>
      </header>
      <nav className="portfolio-tabs" aria-label="Asset form sections">
        {["Property", "Details & photos", ...(asset ? ["Relationships & notes"] : [])].map(
          (t, i) => (
            <button
              type="button"
              key={t}
              disabled={pending || busy || uploading}
              aria-current={step === i ? "step" : undefined}
              onClick={() => setStep(i)}
            >
              {t}
            </button>
          ),
        )}
      </nav>
      <fieldset disabled={busy || uploading}>
        {step === 0 && (
          <>
            <div className="portfolio-fields">
              <Text title="Property name" value={form.title} onChange={(v) => update("title", v)} />
              <Choices
                label="Property type"
                value={form.assetType}
                onChange={(v) => update("assetType", v)}
                options={[
                  ...new Set([
                    "Residential",
                    "Condo",
                    "Multi Family",
                    "Commercial",
                    "Land",
                    form.assetType,
                  ]),
                ]}
              />
              {asset && (
                <Choices
                  label="Asset status"
                  value={form.status}
                  onChange={(v) => update("status", v)}
                  options={assetStatuses}
                />
              )}
            </div>
            <PropertyLocation
              value={form.location}
              request={request}
              onChange={(v) => update("location", v)}
              onPendingChange={setPending}
              disabled={busy}
            />
          </>
        )}
        {step === 1 && (
          <>
            <div className="portfolio-fields">
              <Text
                title="Parcel / APN"
                value={form.parcel}
                onChange={(v) => update("parcel", v)}
              />
              {(["bedrooms", "bathrooms", "yearBuilt"] as const).map((k) => (
                <Amount
                  key={k}
                  title={label(k === "yearBuilt" ? "year built" : k)}
                  value={form.characteristics[k]}
                  onChange={(v) =>
                    update("characteristics", { ...form.characteristics, [k]: v ?? 0 })
                  }
                />
              ))}
              <Text
                title="Building area (sqft)"
                value={form.characteristics.buildingSQFT}
                onChange={(v) =>
                  update("characteristics", { ...form.characteristics, buildingSQFT: v })
                }
              />
              <Text
                title="Lot size"
                value={form.characteristics.lotSize}
                onChange={(v) => update("characteristics", { ...form.characteristics, lotSize: v })}
              />
            </div>
            <Text
              title="Property description"
              multiline
              value={form.description}
              onChange={(v) => update("description", v)}
            />
            <ListingPhotos
              form={photos}
              setForm={(action) => {
                const next = typeof action === "function" ? action(photos) : action;
                setForm((f) => ({
                  ...f,
                  primaryImage: next.thumbnailUrl,
                  media: { ...f.media, images: next.images.split("\n").filter(Boolean) },
                }));
              }}
              onBusyChange={setUploading}
              disabled={busy}
            />
          </>
        )}
        {step === 2 && (
          <>
            <h3>Property relationships</h3>
            <p>
              These describe the Asset. Seller permissions on existing listings are managed
              separately.
            </p>
            {form.relationships.map((r, i) => (
              <div key={i} className="portfolio-fields">
                <label>
                  Account
                  <select
                    value={r.accountId}
                    onChange={(e) =>
                      update(
                        "relationships",
                        form.relationships.map((x, j) =>
                          j === i ? { ...x, accountId: e.target.value } : x,
                        ),
                      )
                    }
                  >
                    <option value="">Choose account</option>
                    {people.map((p) => (
                      <option key={p.accountId} value={p.accountId}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <Choices
                  label="Role"
                  options={["owner", "listingAgent", "coListingAgent", "buyersAgent"]}
                  value={r.role}
                  onChange={(v) =>
                    update(
                      "relationships",
                      form.relationships.map((x, j) => (j === i ? { ...x, role: v } : x)),
                    )
                  }
                />
                <Choices
                  label="Relationship status"
                  options={["active", "pending", "removed"]}
                  value={r.state}
                  onChange={(v) =>
                    update(
                      "relationships",
                      form.relationships.map((x, j) => (j === i ? { ...x, state: v } : x)),
                    )
                  }
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                update("relationships", [
                  ...form.relationships,
                  { accountId: "", role: "owner", state: "active" },
                ])
              }
            >
              Add relationship
            </button>
            <Text
              title="Internal asset notes"
              multiline
              value={form.notes}
              onChange={(v) => update("notes", v)}
            />
          </>
        )}
      </fieldset>
      {error && (
        <p role="alert" className="portfolio-error">
          {error}
        </p>
      )}
      {candidates.length > 0 && (
        <div className="portfolio-notice">
          <h3>Probable existing properties</h3>
          {candidates.map((a) => (
            <p key={a.assetId}>
              <Link to={`/assets/${a.assetId}`}>{a.title}</Link> ·{" "}
              {[a.location.address, a.location.city, a.location.state, a.location.zipcode].join(
                ", ",
              )}{" "}
              · {a.parcel || "No parcel recorded"}
            </p>
          ))}
          <Text title="Reason these are distinct properties" value={reason} onChange={setReason} />
          <small>
            Open the existing Asset to use it or associate its listing. Creating separately does not
            merge either property.
          </small>
        </div>
      )}
      {pending && <p role="status">Confirm or cancel the map adjustment before saving.</p>}
      <footer>
        <button type="button" disabled={busy || uploading} onClick={onCancel}>
          Cancel
        </button>
        {step === 0 && (
          <button type="button" disabled={pending || busy} onClick={() => setStep(1)}>
            Details & photos
          </button>
        )}
        <button
          className="portfolio-primary"
          type="button"
          disabled={busy || pending || uploading || !form.title.trim()}
          onClick={() => void save()}
        >
          {busy ? "Saving…" : asset ? "Save asset" : "Create asset"}
        </button>
      </footer>
    </section>
  );
}
export function OpportunityForm({
  asset,
  opportunity,
  people = [],
  onSave,
  onCancel,
}: {
  asset: Asset;
  opportunity?: Opportunity;
  people?: Person[];
  onSave: (input: Partial<Opportunity>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Opportunity>>(
    () =>
      opportunity || {
        type: "liquidation",
        title: `Sale of ${asset.title}`,
        description: "",
        status: "idea",
        priority: "normal",
        assignedAccountId: null,
        source: "",
        estimatedValue: null,
        targetValue: null,
        notes: "",
        askingPrice: null,
        targetAcquisitionPrice: null,
        contactReference: "",
        dueDiligenceSummary: "",
        strategyNotes: "",
        concept: "",
        budgetAssumption: null,
      },
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const update = (key: keyof Opportunity, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));
  async function save() {
    setBusy(true);
    try {
      await onSave(
        Object.fromEntries(
          [
            "type",
            "status",
            "title",
            "description",
            "source",
            "priority",
            "assignedAccountId",
            "estimatedValue",
            "targetValue",
            "notes",
            "askingPrice",
            "targetAcquisitionPrice",
            "contactReference",
            "dueDiligenceSummary",
            "strategyNotes",
            "concept",
            "budgetAssumption",
            "revision",
          ].map((key) => [key, form[key as keyof Opportunity]]),
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="portfolio-panel">
      <h2>{opportunity ? "Edit opportunity" : "New opportunity"}</h2>
      <p>{asset.title} · Internal operations</p>
      <fieldset disabled={busy}>
        <div className="portfolio-fields">
          <Choices
            label="Opportunity type"
            options={opportunity?.listingId ? ["liquidation"] : opportunityTypes}
            value={form.type!}
            onChange={(v) => update("type", v)}
          />
          <Text
            title="Opportunity title"
            value={form.title!}
            onChange={(v) => update("title", v)}
          />
          <Choices
            label="Opportunity status"
            options={opportunityStatuses}
            value={form.status!}
            onChange={(v) => update("status", v)}
          />
          <Choices
            label="Priority"
            options={["low", "normal", "high", "urgent"]}
            value={form.priority!}
            onChange={(v) => update("priority", v)}
          />
          <label>
            Assigned operator
            <select
              value={form.assignedAccountId || ""}
              onChange={(e) => update("assignedAccountId", e.target.value || null)}
            >
              <option value="">Unassigned</option>
              {people
                .filter((p) => p.userType === "admin")
                .map((p) => (
                  <option key={p.accountId} value={p.accountId}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <Text
          title="Description"
          multiline
          value={form.description || ""}
          onChange={(v) => update("description", v)}
        />
        {opportunity && (
          <>
            <div className="portfolio-fields">
              <Text
                title="Source"
                value={form.source || ""}
                onChange={(v) => update("source", v)}
              />
              <Amount
                title="Estimated value (USD)"
                value={form.estimatedValue ?? null}
                onChange={(v) => update("estimatedValue", v)}
              />
              <Amount
                title="Target value (USD)"
                value={form.targetValue ?? null}
                onChange={(v) => update("targetValue", v)}
              />
            </div>
            {form.type === "acquisition" && (
              <>
                <div className="portfolio-fields">
                  <Amount
                    title="Asking price (USD)"
                    value={form.askingPrice ?? null}
                    onChange={(v) => update("askingPrice", v)}
                  />
                  <Amount
                    title="Target acquisition price (USD)"
                    value={form.targetAcquisitionPrice ?? null}
                    onChange={(v) => update("targetAcquisitionPrice", v)}
                  />
                  <Text
                    title="Seller / contact reference"
                    value={form.contactReference || ""}
                    onChange={(v) => update("contactReference", v)}
                  />
                </div>
                <Text
                  title="Due diligence summary"
                  multiline
                  value={form.dueDiligenceSummary || ""}
                  onChange={(v) => update("dueDiligenceSummary", v)}
                />
              </>
            )}
            {["development", "repositioning"].includes(form.type!) && (
              <>
                <Text
                  title="Development / repositioning concept"
                  multiline
                  value={form.concept || ""}
                  onChange={(v) => update("concept", v)}
                />
                <Amount
                  title="Rough budget assumption (USD)"
                  value={form.budgetAssumption ?? null}
                  onChange={(v) => update("budgetAssumption", v)}
                />
              </>
            )}
            <Text
              title="Strategy notes"
              multiline
              value={form.strategyNotes || ""}
              onChange={(v) => update("strategyNotes", v)}
            />
            <Text
              title="Internal notes"
              multiline
              value={form.notes || ""}
              onChange={(v) => update("notes", v)}
            />
          </>
        )}
      </fieldset>
      {error && <p role="alert">{error}</p>}
      <footer>
        <button disabled={busy} onClick={onCancel}>
          Cancel
        </button>
        <button
          className="portfolio-primary"
          disabled={busy || !form.title?.trim()}
          onClick={() => void save()}
        >
          {busy ? "Saving…" : opportunity ? "Save opportunity" : "Create opportunity"}
        </button>
      </footer>
    </section>
  );
}
