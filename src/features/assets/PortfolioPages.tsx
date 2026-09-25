import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { request } from "../../core/api/request";
import PropertyLocation from "../../components/propertyLocation/PropertyLocation";
import { displayAddress } from "../../components/propertyLocation/location";
import { resolveListingMediaUrl } from "../auctions/utils/listingMedia";
import { AssetForm, OpportunityForm, Choices, Text } from "./AssetForms";
import {
  type Asset,
  type Opportunity,
  type Person,
  type Activity,
  type Summary,
  label,
  when,
  money,
  closed,
  assetStatuses,
  opportunityTypes,
  opportunityStatuses,
} from "./types";
import { ListingEditorSection } from "../listingEditor/ListingEditorSection";
import { fetchManagedListing } from "../listingApi";
import type { IListing } from "../../interfaces/IListing";
import "./portfolio.css";
const base = "/api/admin/portfolio";
function useRecord<T>(url: string) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    const c = new AbortController();
    setData(null);
    setError("");
    request<T>(url, { signal: c.signal })
      .then((v) => {
        if (!c.signal.aborted) setData(v);
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [url, version]);
  return { data, error, reload };
}
function Load({ error, retry }: { error: string; retry: () => void }) {
  return (
    <main className="portfolio">
      <p role={error ? "alert" : "status"}>{error || "Loading property operations…"}</p>
      {error && <button onClick={retry}>Try again</button>}
    </main>
  );
}
function Badge({ value }: { value: string }) {
  return <span className={`portfolio-badge portfolio-badge--${value}`}>{label(value)}</span>;
}
function Photo({ asset }: { asset: Asset }) {
  const src = resolveListingMediaUrl(asset.primaryImage || asset.media.images?.[0] || "");
  return src ? (
    <img className="portfolio-photo" src={src} alt={asset.title} />
  ) : (
    <div className="portfolio-photo portfolio-placeholder">Property photo not added</div>
  );
}
const activeOpportunity = (asset: Asset) =>
  asset.opportunities.find((o) => !closed(o.status)) || asset.opportunities[0];
export function AssetsPage() {
  const { data, error, reload } = useRecord<Asset[]>(base + "/assets");
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const q = params.get("q") || "",
    status = params.get("status") || "",
    type = params.get("type") || "",
    opStatus = params.get("opportunityStatus") || "";
  const filter = (key: string, value: string) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        if (value) n.set(key, value);
        else n.delete(key);
        return n;
      },
      { replace: true },
    );
  const visible = data?.filter(
    (a) =>
      (!q ||
        [a.title, a.parcel, displayAddress(a.location)]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase())) &&
      (!status || a.status === status) &&
      ((!type && !opStatus) ||
        a.opportunities.some(
          (o) => (!type || o.type === type) && (!opStatus || o.status === opStatus),
        )),
  );
  if (!data) return <Load error={error} retry={reload} />;
  return (
    <main className="portfolio">
      <header className="portfolio-heading">
        <div>
          <p className="portfolio-eyebrow">Property operations</p>
          <h1>Assets</h1>
          <p>One property record, every opportunity, and a clear next action.</p>
        </div>
        <button className="portfolio-primary" onClick={() => setCreating(true)}>
          Add asset
        </button>
      </header>
      {creating ? (
        <AssetForm
          onCancel={() => setCreating(false)}
          onSave={async (input) => {
            const asset = await request<Asset>(base + "/assets", {
              method: "POST",
              body: JSON.stringify(input),
            });
            navigate(`/assets/${asset.assetId}`);
          }}
        />
      ) : (
        <>
          <div className="portfolio-stats">
            <div>
              <strong>{data.length}</strong>
              <span>Properties</span>
            </div>
            <div>
              <strong>
                {data.reduce(
                  (n, a) => n + a.opportunities.filter((o) => !closed(o.status)).length,
                  0,
                )}
              </strong>
              <span>Open opportunities</span>
            </div>
            <div>
              <strong>
                {
                  data.filter((a) => a.opportunities.some((o) => o.summary.phase === "closing"))
                    .length
                }
              </strong>
              <span>In closing</span>
            </div>
            <div>
              <strong>{data.filter((a) => a.status === "sold").length}</strong>
              <span>Marked sold</span>
            </div>
          </div>
          <div className="portfolio-filters">
            <label>
              Find property
              <input
                type="search"
                value={q}
                placeholder="Name, address, or parcel / APN"
                onChange={(e) => filter("q", e.target.value)}
              />
            </label>
            <Choices
              label="Asset status"
              value={status}
              options={assetStatuses}
              empty="All statuses"
              onChange={(v) => filter("status", v)}
            />
            <Choices
              label="Opportunity type"
              value={type}
              options={opportunityTypes}
              empty="All types"
              onChange={(v) => filter("type", v)}
            />
            <Choices
              label="Opportunity status"
              value={opStatus}
              options={opportunityStatuses}
              empty="All statuses"
              onChange={(v) => filter("opportunityStatus", v)}
            />
            <button onClick={reload}>Refresh</button>
          </div>
          <p className="portfolio-muted">{visible?.length} properties</p>
          <div className="portfolio-asset-list">
            {visible?.map((a) => {
              const o = activeOpportunity(a);
              return (
                <article key={a.assetId} className="portfolio-asset-row">
                  <Photo asset={a} />
                  <div>
                    <Link className="portfolio-title" to={`/assets/${a.assetId}`}>
                      {a.title}
                    </Link>
                    <p>{displayAddress(a.location) || "Address not added"}</p>
                    <p>
                      <Badge value={a.status} /> {a.parcel && <>Parcel {a.parcel}</>}
                      {!!a.duplicateCount && (
                        <span className="portfolio-warning"> · Possible duplicate</span>
                      )}
                    </p>
                  </div>
                  <div>
                    {o ? (
                      <>
                        <Link to={`/opportunities/${o.opportunityId}`}>{o.title}</Link>
                        <p>
                          {label(o.type)} · {label(o.status)}
                        </p>
                        <small>
                          {o.operator || "Unassigned"}
                          {a.opportunities.length > 1 &&
                            ` · ${a.opportunities.length} opportunities`}
                        </small>
                      </>
                    ) : (
                      <p>No opportunity yet</p>
                    )}
                  </div>
                  <div>
                    <strong>{o ? label(o.summary.phase) : "Ready to evaluate"}</strong>
                    <p>{o?.summary.nextAction || "Create an opportunity"}</p>
                    <small>Latest activity {when(a.updatedAt)}</small>
                  </div>
                </article>
              );
            })}
          </div>
          {!visible?.length && (
            <div className="portfolio-empty">
              <h2>
                {data.length ? "No matching properties" : "Your property portfolio starts here"}
              </h2>
              <p>
                {data.length
                  ? "Adjust the filters to see more assets."
                  : "Add an asset or continue creating a listing. Existing listings are linked automatically."}
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
function OpportunityCards({ items }: { items: Opportunity[] }) {
  return (
    <div className="portfolio-opportunities">
      {items.map((o) => (
        <article className="portfolio-panel" key={o.opportunityId}>
          <div className="portfolio-between">
            <Badge value={o.type} />
            <Badge value={o.status} />
          </div>
          <h3>
            <Link to={`/opportunities/${o.opportunityId}`}>{o.title}</Link>
          </h3>
          <p>{o.description || "Add context to help the next operator."}</p>
          <p>
            {label(o.priority)} priority · {o.operator || "Unassigned"}
          </p>
          <div className="portfolio-next">
            <small>Next action · {label(o.summary.phase)}</small>
            <strong>{o.summary.nextAction}</strong>
          </div>
        </article>
      ))}
    </div>
  );
}
export function AssetWorkspace() {
  const { assetId } = useParams();
  const {
    data: asset,
    error,
    reload,
  } = useRecord<Asset>(`${base}/assets/${encodeURIComponent(assetId!)}`);
  const [tab, setTab] = useState("overview"),
    [editing, setEditing] = useState(false),
    [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  if (!asset) return <Load error={error} retry={reload} />;
  return (
    <main className="portfolio">
      <Link className="portfolio-back" to="/assets">
        Assets / {asset.title}
      </Link>
      <header className="portfolio-heading">
        <div>
          <p className="portfolio-eyebrow">Current property record</p>
          <h1>{asset.title}</h1>
          <p>{displayAddress(asset.location)}</p>
          <Badge value={asset.status} />
        </div>
        <div className="portfolio-actions">
          <button onClick={() => setEditing(true)}>Edit asset</button>
          <button
            className="portfolio-primary"
            disabled={asset.status === "archived"}
            onClick={() => setCreating(true)}
          >
            New opportunity
          </button>
        </div>
      </header>
      {editing ? (
        <AssetForm
          asset={asset}
          people={asset.people}
          onCancel={() => setEditing(false)}
          onSave={async (input) => {
            await request(`${base}/assets/${asset.assetId}`, {
              method: "PATCH",
              body: JSON.stringify(input),
            });
            setEditing(false);
            reload();
          }}
        />
      ) : creating ? (
        <OpportunityForm
          asset={asset}
          people={asset.people}
          onCancel={() => setCreating(false)}
          onSave={async (input) => {
            const o = await request<Opportunity>(`${base}/assets/${asset.assetId}/opportunities`, {
              method: "POST",
              body: JSON.stringify(input),
            });
            navigate(`/opportunities/${o.opportunityId}`);
          }}
        />
      ) : (
        <>
          <nav className="portfolio-tabs" aria-label="Asset sections">
            {["overview", "opportunities", "liquidation", "activity", "documents"].map((t) => (
              <button
                key={t}
                aria-current={tab === t ? "page" : undefined}
                onClick={() => setTab(t)}
              >
                {label(t)}
              </button>
            ))}
          </nav>
          {tab === "overview" && (
            <>
              <div className="portfolio-overview">
                <Photo asset={asset} />
                <section className="portfolio-panel">
                  <h2>Property identity</h2>
                  <dl>
                    <dt>Property type</dt>
                    <dd>{asset.assetType}</dd>
                    <dt>Parcel / APN</dt>
                    <dd>{asset.parcel || "Not recorded"}</dd>
                    <dt>Rooms</dt>
                    <dd>
                      {asset.characteristics.bedrooms} beds · {asset.characteristics.bathrooms}{" "}
                      baths
                    </dd>
                    <dt>Building / lot</dt>
                    <dd>
                      {asset.characteristics.buildingSQFT || "—"} sqft ·{" "}
                      {asset.characteristics.lotSize || "Lot size not recorded"}
                    </dd>
                    <dt>Year built</dt>
                    <dd>{asset.characteristics.yearBuilt || "Not recorded"}</dd>
                  </dl>
                  <p>{asset.description}</p>
                </section>
              </div>
              <details className="portfolio-panel">
                <summary>Location and property map</summary>
                <PropertyLocation
                  value={asset.location}
                  onChange={() => {}}
                  request={request}
                  disabled
                />
              </details>
              <section className="portfolio-panel">
                <h2>Associated people</h2>
                {asset.relationships.length ? (
                  asset.relationships.map((r, i) => (
                    <p key={i}>
                      {asset.people?.find((p) => p.accountId === r.accountId)?.name || "Account"} ·{" "}
                      {label(r.role)} · {label(r.state)}
                    </p>
                  ))
                ) : (
                  <p>No relationships recorded. Add these in Edit asset.</p>
                )}
                <h3>Internal notes</h3>
                <p className="portfolio-preserve">{asset.notes || "No internal notes yet."}</p>
              </section>
              {!!asset.duplicates?.length && (
                <section className="portfolio-notice">
                  <h3>Review probable duplicates</h3>
                  {asset.duplicates.map((a) => (
                    <p key={a.assetId}>
                      <Link to={`/assets/${a.assetId}`}>{a.title}</Link> ·{" "}
                      {displayAddress(a.location)}
                    </p>
                  ))}
                  <p>
                    These records remain separate. Associate a listing below only after verifying
                    property identity.
                  </p>
                </section>
              )}
              <AssociateListing asset={asset} done={reload} />
            </>
          )}
          {tab === "opportunities" && (
            <>
              <h2>Open opportunities</h2>
              <OpportunityCards items={asset.opportunities.filter((o) => !closed(o.status))} />
              {!asset.opportunities.some((o) => !closed(o.status)) && (
                <p>No open opportunities. Create one to define the next step.</p>
              )}
              <h2>Historical opportunities</h2>
              <OpportunityCards items={asset.opportunities.filter((o) => closed(o.status))} />
            </>
          )}
          {tab === "liquidation" && (
            <>
              <p className="portfolio-notice">
                Current Asset details are independent of approved listing snapshots and finalized
                sale records. Open the linked workspace to manage that workflow.
              </p>
              {asset.opportunities
                .filter((o) => o.type === "liquidation")
                .map((o) => (
                  <section key={o.opportunityId} className="portfolio-panel">
                    <h2>
                      <Link to={`/opportunities/${o.opportunityId}`}>{o.title}</Link>
                    </h2>
                    <Workflow summary={o.summary} />
                  </section>
                ))}
              {!asset.opportunities.some((o) => o.type === "liquidation") && (
                <p>Create a liquidation opportunity to begin a sale.</p>
              )}
            </>
          )}
          {tab === "activity" && <Timeline items={asset.activity} people={asset.people} />}
          {tab === "documents" && (
            <section className="portfolio-panel">
              <h2>Property and sale documents</h2>
              <p>
                Due diligence documents remain with their listing. Agreements and closing documents
                remain with the transaction, with their existing access controls.
              </p>
              {asset.opportunities
                .filter((o) => o.listingId)
                .map((o) => (
                  <p key={o.opportunityId}>
                    <Link to={`/opportunities/${o.opportunityId}`}>
                      Open documents through {o.title}
                    </Link>
                  </p>
                ))}
              <p>Independent Asset document storage is reserved for a later phase.</p>
            </section>
          )}
        </>
      )}
    </main>
  );
}
function AssociateListing({ asset, done }: { asset: Asset; done: () => void }) {
  const [open, setOpen] = useState(false),
    [listings, setListings] = useState<
      { listingId: string; title: string; location: Asset["location"]; assetId?: string }[]
    >([]),
    [selected, setSelected] = useState(""),
    [reason, setReason] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    setOpen(true);
    try {
      setListings(await request(base + "/listing-choices"));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function link() {
    setBusy(true);
    try {
      await request(`${base}/assets/${asset.assetId}/listings/${selected}`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      done();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="portfolio-panel">
      <button onClick={() => void load()}>Associate an existing listing</button>
      {open && (
        <>
          <p>
            Verify that this is the same physical property. This moves its liquidation opportunity
            to this Asset. Historical sale snapshots remain unchanged.
          </p>
          <label>
            Listing
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">Choose a property</option>
              {listings
                .filter((l) => l.assetId !== asset.assetId)
                .map((l) => (
                  <option key={l.listingId} value={l.listingId}>
                    {l.title} · {displayAddress(l.location)}
                  </option>
                ))}
            </select>
          </label>
          <Text title="Association reason" value={reason} onChange={setReason} />
          <button disabled={busy || !selected || !reason.trim()} onClick={() => void link()}>
            Confirm property association
          </button>
          {error && <p role="alert">{error}</p>}
        </>
      )}
    </section>
  );
}
export function OpportunitiesPage() {
  const { data, error, reload } = useRecord<Opportunity[]>(base + "/opportunities");
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [type, setType] = useState(""),
    [creating, setCreating] = useState(false),
    [assets, setAssets] = useState<Asset[]>([]),
    [selected, setSelected] = useState(""),
    [people, setPeople] = useState<Person[]>([]),
    [createError, setCreateError] = useState("");
  const navigate = useNavigate();
  async function start() {
    try {
      const [a, p] = await Promise.all([
        request<Asset[]>(base + "/assets"),
        request<Person[]>(base + "/directory"),
      ]);
      setAssets(a);
      setPeople(p);
      setCreating(true);
    } catch (e) {
      setCreateError((e as Error).message);
    }
  }
  if (!data) return <Load error={error} retry={reload} />;
  const asset = assets.find((a) => a.assetId === selected);
  const visible = data.filter(
    (o) =>
      (!query ||
        [o.title, o.asset?.title, o.asset && displayAddress(o.asset.location)]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (!type || o.type === type) &&
      (!status || o.status === status),
  );
  return (
    <main className="portfolio">
      <header className="portfolio-heading">
        <div>
          <p className="portfolio-eyebrow">Internal operations</p>
          <h1>Opportunities</h1>
          <p>Evaluate possibilities and connect them to the right property workflow.</p>
        </div>
        <button className="portfolio-primary" onClick={() => void start()}>
          New opportunity
        </button>
      </header>
      {createError && <p role="alert">{createError}</p>}
      {creating ? (
        <>
          <label>
            Property asset
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">Choose an asset</option>
              {assets
                .filter((a) => a.status !== "archived")
                .map((a) => (
                  <option key={a.assetId} value={a.assetId}>
                    {a.title} · {displayAddress(a.location)}
                  </option>
                ))}
            </select>
          </label>
          {asset ? (
            <OpportunityForm
              key={selected}
              asset={asset}
              people={people}
              onCancel={() => setCreating(false)}
              onSave={async (input) => {
                const o = await request<Opportunity>(
                  `${base}/assets/${asset.assetId}/opportunities`,
                  { method: "POST", body: JSON.stringify(input) },
                );
                navigate(`/opportunities/${o.opportunityId}`);
              }}
            />
          ) : (
            <p>
              Select a property or <Link to="/assets">add an asset</Link> first.{" "}
              <button onClick={() => setCreating(false)}>Cancel</button>
            </p>
          )}
        </>
      ) : (
        <>
          <div className="portfolio-filters">
            <label>
              Search opportunities
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Opportunity or property"
              />
            </label>
            <Choices
              label="Type"
              value={type}
              onChange={setType}
              options={opportunityTypes}
              empty="All types"
            />
            <Choices
              label="Status"
              value={status}
              onChange={setStatus}
              options={opportunityStatuses}
              empty="All statuses"
            />
            <button onClick={reload}>Refresh</button>
          </div>
          {visible.map((o) => (
            <section key={o.opportunityId} className="portfolio-opportunity-row">
              <div>
                <Link className="portfolio-title" to={`/opportunities/${o.opportunityId}`}>
                  {o.title}
                </Link>
                <p>
                  <Link to={`/assets/${o.assetId}`}>{o.asset?.title}</Link> ·{" "}
                  {o.asset && displayAddress(o.asset.location)}
                </p>
              </div>
              <div>
                <Badge value={o.type} /> <Badge value={o.status} />
                <p>
                  {o.operator || "Unassigned"} · {label(o.priority)} priority
                </p>
              </div>
              <div>
                <strong>{o.summary.nextAction}</strong>
                <p>Updated {when(o.updatedAt)}</p>
              </div>
            </section>
          ))}
          {!visible.length && (
            <div className="portfolio-empty">
              No matching opportunities. Create one from a property asset.
            </div>
          )}
        </>
      )}
    </main>
  );
}
export function OpportunityWorkspace() {
  const { opportunityId } = useParams();
  const {
    data: o,
    error,
    reload,
  } = useRecord<Opportunity>(`${base}/opportunities/${encodeURIComponent(opportunityId!)}`);
  const [editing, setEditing] = useState(false),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState("");
  const navigate = useNavigate();
  async function createListing() {
    setBusy(true);
    try {
      const listing = await request<IListing>(`${base}/opportunities/${o!.opportunityId}/listing`, {
        method: "POST",
      });
      navigate(`/listings/${listing.listingId}`);
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!o || !o.asset) return <Load error={error} retry={reload} />;
  return (
    <main className="portfolio">
      <Link className="portfolio-back" to={`/assets/${o.assetId}`}>
        Assets / {o.asset.title} / Opportunity
      </Link>
      <header className="portfolio-heading">
        <div>
          <p className="portfolio-eyebrow">{label(o.type)} opportunity</p>
          <h1>{o.title}</h1>
          <p>{displayAddress(o.asset.location)}</p>
          <Badge value={o.status} />
        </div>
        <button onClick={() => setEditing(true)}>Edit opportunity</button>
      </header>
      {editing ? (
        <OpportunityForm
          asset={o.asset}
          opportunity={o}
          people={o.people}
          onCancel={() => setEditing(false)}
          onSave={async (input) => {
            await request(`${base}/opportunities/${o.opportunityId}`, {
              method: "PATCH",
              body: JSON.stringify(input),
            });
            setEditing(false);
            reload();
          }}
        />
      ) : (
        <>
          <section className="portfolio-next portfolio-panel">
            <small>Current phase · {label(o.summary.phase)}</small>
            <h2>{o.summary.nextAction}</h2>
            <p>
              The opportunity status tracks the business decision; linked workflows keep their own
              lifecycle.
            </p>
          </section>
          <section className="portfolio-panel">
            <h2>Opportunity overview</h2>
            <p className="portfolio-preserve">{o.description || "No description yet."}</p>
            <dl>
              <dt>Operator</dt>
              <dd>{o.operator || "Unassigned"}</dd>
              <dt>Priority</dt>
              <dd>{label(o.priority)}</dd>
              <dt>Source</dt>
              <dd>{o.source || "Not recorded"}</dd>
              <dt>Estimated / target value</dt>
              <dd>
                {money(o.estimatedValue)} / {money(o.targetValue)}
              </dd>
            </dl>
            {o.type === "acquisition" && (
              <>
                <h3>Acquisition assumptions</h3>
                <p>
                  Asking {money(o.askingPrice)} · Target acquisition{" "}
                  {money(o.targetAcquisitionPrice)}
                </p>
                <p>Seller / contact: {o.contactReference || "Not recorded"}</p>
                <h4>Due diligence summary</h4>
                <p className="portfolio-preserve">{o.dueDiligenceSummary || "Not started"}</p>
              </>
            )}
            {["development", "repositioning"].includes(o.type) && (
              <>
                <h3>Concept & assumptions</h3>
                <p className="portfolio-preserve">
                  {o.concept || "Define the concept in Edit opportunity."}
                </p>
                <p>Rough budget {money(o.budgetAssumption)}</p>
              </>
            )}
            <h3>Strategy notes</h3>
            <p className="portfolio-preserve">{o.strategyNotes || "No strategy notes."}</p>
            <h3>Internal notes</h3>
            <p className="portfolio-preserve">{o.notes || "No internal notes."}</p>
          </section>
          {o.type === "liquidation" && (
            <section className="portfolio-panel">
              <h2>Liquidation workflow</h2>
              <p>
                Listing approvals and sale results preserve their original property information.
                Asset edits do not rewrite those records.
              </p>
              <Workflow summary={o.summary} />
              {!o.summary.listing && !closed(o.status) && (
                <button
                  className="portfolio-primary"
                  disabled={busy}
                  onClick={() => void createListing()}
                >
                  {busy ? "Preparing listing…" : "Create listing from asset"}
                </button>
              )}
              {actionError && <p role="alert">{actionError}</p>}
              {o.readiness && (
                <details>
                  <summary>Listing and auction readiness</summary>
                  <ul className="portfolio-checks">
                    {o.readiness.checks.map((c) => (
                      <li key={c.code}>
                        {c.satisfied ? "✓" : "○"} {c.label}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </section>
          )}
          {o.type !== "liquidation" && (
            <p className="portfolio-notice">
              This phase records strategy and assumptions. Offers, financing, construction tasks,
              and project execution are future workflows.
            </p>
          )}
          <section className="portfolio-panel">
            <h2>Opportunity activity</h2>
            <Timeline items={o.activity} people={o.people} />
          </section>
        </>
      )}
    </main>
  );
}
function Workflow({ summary: s }: { summary: Summary }) {
  return (
    <div className="portfolio-workflow">
      <div>
        <small>Listing / review</small>
        {s.listing ? (
          <>
            <Link to={`/listings/${s.listing.listingId}`}>{s.listing.title}</Link>
            <p>
              {label(s.listing.moderationStatus || "pending")} ·{" "}
              {label(s.listing.status || "draft")}
            </p>
            <Link to={`/messages?listingId=${s.listing.listingId}`}>Review & seller documents</Link>
            {!s.auctions.length && (
              <p>
                <Link to={`/auctions?create=1&listing=${s.listing.listingId}`}>
                  Configure auction
                </Link>
              </p>
            )}
          </>
        ) : (
          <p>No listing created yet</p>
        )}
      </div>
      <div>
        <small>Auction / result</small>
        {s.auctions.map((a) => (
          <p key={a.auctionId}>
            <Link to={`/auctions/${a.auctionId}/edit`}>{label(a.status)} auction</Link>
            {a.result && (
              <span>
                {" "}
                · {a.result.invalidated ? "Result invalidated" : label(a.result.outcome)}
                {a.result.winningAmount != null && ` · ${money(a.result.winningAmount)}`}
              </span>
            )}
          </p>
        ))}
        {s.auctionDrafts.map((d) => (
          <p key={d.id}>
            <Link to={`/auctions/${d.id}/edit`}>{label(d.status)} preparation</Link>
          </p>
        ))}
        {!s.auctions.length && !s.auctionDrafts.length && <p>Not configured</p>}
      </div>
      <div>
        <small>Transaction / closing</small>
        {s.transactions.map((t) => (
          <p key={t.transactionId}>
            <Link to={`/transactions/${t.transactionId}`}>
              {label(t.status)} · {money(t.winningAmount)}
            </Link>
            <small>
              {t.property.title} · {t.property.address}
            </small>
          </p>
        ))}
        {!s.transactions.length && <p>No finalized sale transaction</p>}
      </div>
    </div>
  );
}
function Timeline({ items, people = [] }: { items: Activity[]; people?: Person[] }) {
  return (
    <ol className="portfolio-timeline">
      {[...items]
        .sort((a, b) => b.at.localeCompare(a.at))
        .map((e) => {
          const path = e.link
            ? (
                {
                  listing: "/listings/",
                  auction: "/auctions/",
                  transaction: "/transactions/",
                  opportunity: "/opportunities/",
                } as Record<string, string>
              )[e.link.kind] + e.link.id
            : null;
          return (
            <li key={e.eventId}>
              <div>
                <strong>{label(e.type.replace(/\./g, " "))}</strong>
                <small>
                  {when(e.at)} ·{" "}
                  {e.actorAccountId
                    ? people.find((p) => p.accountId === e.actorAccountId)?.name || "Administrator"
                    : "System"}
                </small>
              </div>
              {!!e.details.reason && <p>{String(e.details.reason)}</p>}
              {!!e.details.changes && (
                <p>
                  Changed:{" "}
                  {Object.keys(e.details.changes as object)
                    .map(label)
                    .join(", ")}
                </p>
              )}
              {path && <Link to={path}>Open {e.link!.kind}</Link>}
            </li>
          );
        })}
      {!items.length && <li>No activity yet.</li>}
    </ol>
  );
}
export function ListingWorkspace() {
  const { listingId } = useParams();
  const [listing, setListing] = useState<IListing | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetchManagedListing(listingId!)
      .then((l) => {
        if (active) setListing(l);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [listingId]);
  return (
    <main className="portfolio">
      <Link to={listing?.assetId ? `/assets/${listing.assetId}` : "/assets"}>Back to asset</Link>
      <header className="portfolio-heading">
        <div>
          <h1>Listing workspace</h1>
          <p>Sale information and review remain separate from the current Asset record.</p>
        </div>
        {listing && (
          <Link
            className="portfolio-primary"
            to={`/auctions?create=1&listing=${listing.listingId}`}
          >
            Configure auction
          </Link>
        )}
      </header>
      {error ? (
        <p role="alert">{error}</p>
      ) : listing ? (
        <>
          <ListingEditorSection key={listing.listingId} listing={listing} onUpdated={setListing} />
          <Link to={`/messages?listingId=${listing.listingId}`}>
            Open review & seller documents
          </Link>
        </>
      ) : (
        <p>Loading listing…</p>
      )}
    </main>
  );
}
