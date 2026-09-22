import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate, useRevalidator } from "react-router-dom";
import type { AuctionOverview } from "../auctions/types";
import type { IAuction } from "../../interfaces/IAuction";
import { request } from "../../core/api/request";
import { getListingThumbnail } from "../auctions/utils/listingMedia";
import {
  patchAuctionDraft,
  type AuctionDraftRecord,
  approveAuction,
  submitAuction,
  publishAuction,
  updateAuctionSchedule,
  pauseAuction,
  resumeAuction,
  endAuction,
  cancelAuction,
  archiveAuction,
  relistAuction,
  requestAuctionChanges,
  rejectAuction,
} from "../auctions/services/auctionDashboardApi";
import LiquidationReview from "../liquidation/LiquidationReview";
import type { Liquidation } from "../liquidation/types";
import { ListingEditorSection } from "../listingEditor/ListingEditorSection";
import { useAuctionDrawerCloseGuard } from "../auctionDrawer/AuctionDrawerRoute";
import {
  accountIds,
  configurationChecks,
  destination,
  setupFor,
  preparationStatus,
  type Check,
  type Readiness,
  type Section,
  type Setup,
} from "./preparation";
import "./preparation.css";

const sections: { id: Section; title: string; description: string }[] = [
  { id: "property", title: "Property", description: "Listing & seller" },
  { id: "verification", title: "Verification", description: "Authority & documents" },
  { id: "setup", title: "Auction setup", description: "Pricing & schedule" },
  { id: "launch", title: "Review & launch", description: "Final checks" },
];
const errorMessage = (cause: unknown) =>
  cause instanceof Error ? cause.message : "Unable to complete this action.";
const money = (value?: string | number) =>
  value == null || value === "" ? "Not configured" : `$${Number(value).toLocaleString()}`;
const when = (value?: string) =>
  value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString() : "Not configured";

export default function AuctionPreparation({
  row,
  onUpdate,
  onReplace,
}: {
  row: AuctionOverview;
  onUpdate: (row: AuctionOverview) => void;
  onReplace: (previousId: string, row: AuctionOverview) => void;
}) {
  const navigate = useNavigate();
  const { revalidate } = useRevalidator();
  const [section, setSection] = useState<Section>("property");
  const [baseline, setBaseline] = useState(() => setupFor(row));
  const [form, setForm] = useState<Setup>(baseline);
  const [savedVersion, setSavedVersion] = useState(
    row.auctionDraft?.updatedAt ?? row.auction.updatedAt,
  );
  const [readiness, setReadiness] = useState<Readiness | null>(row.preparationReadiness ?? null);
  const [checking, setChecking] = useState(true);
  const [readinessError, setReadinessError] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [verification, setVerification] = useState<Liquidation | null>(null);
  const [propertyDirty, setPropertyDirty] = useState(false);
  const [editingProperty, setEditingProperty] = useState(false);
  const latest = useRef(row);
  latest.current = row;
  const sequence = useRef(0);
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const changedElsewhere = (row.auctionDraft?.updatedAt ?? row.auction.updatedAt) !== savedVersion;
  const isPreparation =
    Boolean(row.auctionDraft) ||
    ["draft", "pending_approval", "changes_requested"].includes(row.auction.status);
  const locked = row.auctionDraft
    ? !["draft", "changes_requested"].includes(row.auctionDraft.status)
    : !["draft", "changes_requested", "scheduled"].includes(row.auction.status) ||
      row.bid.bidCount > 0;
  const closeGuard = useCallback(
    () =>
      !busy &&
      (!(dirty || propertyDirty) || window.confirm("Discard unsaved preparation changes?")),
    [busy, dirty, propertyDirty],
  );
  useAuctionDrawerCloseGuard(closeGuard);
  useEffect(() => {
    if (!dirty && !propertyDirty && !busy) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, propertyDirty, busy]);
  const refreshReadiness = useCallback(async () => {
    const seq = ++sequence.current;
    const current = latest.current;
    setChecking(true);
    setReadinessError("");
    try {
      const data = await request<Readiness>(
        current.auctionDraft
          ? `/api/drafts/auctions/${current.auctionDraft.id}/readiness`
          : `/api/auctions/${current.auction.id}/readiness`,
      );
      if (seq === sequence.current) {
        setReadiness(data);
      }
      return data;
    } catch (cause) {
      if (seq === sequence.current) {
        setReadinessError(errorMessage(cause));
        setReadiness(null);
      }
      return null;
    } finally {
      if (seq === sequence.current) setChecking(false);
    }
  }, []);
  const cancelReadiness = useCallback(() => {
    sequence.current++;
  }, []);
  useEffect(() => {
    void refreshReadiness();
    const onFocus = () => {
      void refreshReadiness();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      cancelReadiness();
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshReadiness, cancelReadiness, row.auctionDraft?.updatedAt, row.auction.updatedAt]);
  const verificationUpdated = useCallback(
    (data: Liquidation) => {
      setVerification(data);
      void refreshReadiness();
      revalidate();
    },
    [refreshReadiness, revalidate],
  );
  const localChecks = configurationChecks(form);
  const checks: Check[] = readiness
    ? [
        ...readiness.checks.filter((c) => !localChecks.some((local) => local.code === c.code)),
        ...localChecks,
      ]
    : localChecks;
  const blockers = checks.filter((c) => !c.satisfied);
  const ready = Boolean(readiness && !readinessError && !blockers.length);
  const future = Date.parse(form.startDate) > Date.now();
  const launchLabel = future ? "Schedule Auction" : "Publish Auction";
  const canLaunch = isPreparation && row.auctionDraft?.status !== "rejected";
  function change<K extends keyof Setup>(key: K, value: Setup[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setNotice("");
  }
  function visit(next: Section) {
    if (section === "property" && next !== "property" && propertyDirty) {
      if (!window.confirm("Discard unsaved property corrections?")) return;
      setEditingProperty(false);
    }
    setSection(next);
    window.requestAnimationFrame(() => document.getElementById(`preparation-${next}`)?.focus());
  }
  function navigateSafely(url: string) {
    if (closeGuard()) navigate(url);
  }
  function reloadSetup() {
    if (!closeGuard()) return;
    const next = setupFor(row);
    setForm(next);
    setBaseline(next);
    setSavedVersion(row.auctionDraft?.updatedAt ?? row.auction.updatedAt);
    setError("");
    void refreshReadiness();
  }
  async function save() {
    setBusy("Saving changes…");
    setError("");
    setNotice("");
    try {
      // Incomplete drafts are saveable, but invalid typed values must never disappear silently.
      for (const [name, value] of [
        ["Opening bid", form.startingBid],
        ["Bid increment", form.increment],
        ["Reserve", form.reserve],
      ]) {
        if (value.trim() && (!Number.isFinite(Number(value)) || Number(value) <= 0))
          throw new Error(`${name} must be greater than zero.`);
      }
      const config = {
        startingBid: form.startingBid.trim() ? Number(form.startingBid) : undefined,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        isPrivate: form.isPrivate,
        authorizedAccountIds: form.isPrivate ? accountIds(form.authorized) : [],
        rules: {
          ...(row.auctionDraft?.payload?.rules ?? row.auction.rules),
          bidIncrement: form.increment.trim() ? Number(form.increment) : undefined,
          reservePrice: form.reserve.trim() ? Number(form.reserve) : undefined,
        },
      };
      let next: AuctionOverview;
      if (row.auctionDraft) {
        const draft = await patchAuctionDraft(row.auctionDraft.id, {
          ...row.auctionDraft.payload,
          listingId: row.auction.listingId,
          ...config,
        });
        next = {
          ...row,
          auctionDraft: draft,
          auction: {
            ...row.auction,
            ...config,
            rules: {
              ...row.auction.rules,
              ...config.rules,
              bidIncrement: config.rules.bidIncrement ?? 0,
            },
            updatedAt: draft.updatedAt,
          },
        };
      } else {
        if (localChecks.some((c) => !c.satisfied))
          throw new Error("Resolve auction setup fields before saving these auction terms.");
        const auction = await request<IAuction>(`/api/auctions/${row.auction.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            ...config,
            rules: { ...config.rules, reservePrice: config.rules.reservePrice ?? null },
          }),
        });
        next = { ...row, auction };
      }
      latest.current = next;
      onUpdate(next);
      setBaseline(form);
      setSavedVersion(next.auctionDraft?.updatedAt ?? next.auction.updatedAt);
      setNotice("All auction setup changes saved.");
      await refreshReadiness();
      revalidate();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy("");
    }
  }
  async function launch() {
    if (dirty || propertyDirty || changedElsewhere) {
      setError("Save or reload your changes before launching.");
      return;
    }
    setBusy("Checking and launching…");
    setError("");
    setNotice("");
    try {
      const current = await refreshReadiness();
      if (!current?.ready) {
        visit("launch");
        return;
      }
      let auction: IAuction;
      if (row.auctionDraft) {
        const result = await request<{ auction: IAuction; draft: AuctionDraftRecord }>(
          `/api/drafts/auctions/${row.auctionDraft.id}/launch`,
          { method: "POST", body: JSON.stringify({ expectedUpdatedAt: savedVersion }) },
        );
        auction = result.auction;
      } else {
        if (row.auction.status === "changes_requested") await submitAuction(row.auction.id);
        auction = ["pending_approval", "changes_requested"].includes(row.auction.status)
          ? await approveAuction(row.auction.id)
          : future
            ? await updateAuctionSchedule(
                row.auction.id,
                new Date(form.startDate).toISOString(),
                new Date(form.endDate).toISOString(),
              )
            : await publishAuction(row.auction.id);
      }
      const next = { ...row, auction, auctionDraft: undefined };
      onReplace(row.auction.id, next);
      revalidate();
      navigate(`/auctions/${auction.id}/edit`, { replace: true });
      setSavedVersion(auction.updatedAt);
      setNotice(
        auction.status === "scheduled"
          ? "Auction scheduled. It will go live at its start time if verification remains complete."
          : "Auction is live.",
      );
    } catch (cause) {
      setError(errorMessage(cause));
      const details = (cause as { details?: { readiness?: Readiness } }).details;
      if (details?.readiness) setReadiness(details.readiness);
      else await refreshReadiness();
      revalidate();
      visit("launch");
    } finally {
      setBusy("");
    }
  }
  async function advanced(kind: string) {
    if (dirty || propertyDirty) {
      setError("Save your changes before using management actions.");
      return;
    }
    const reason = ["pause", "cancel", "request-changes", "reject"].includes(kind)
      ? window.prompt("Reason for this action")?.trim()
      : undefined;
    if (["pause", "cancel", "request-changes", "reject"].includes(kind) && !reason) return;
    if (["end", "archive"].includes(kind) && !window.confirm(`Confirm ${kind} auction?`)) return;
    setBusy("Updating auction…");
    setError("");
    try {
      if (row.auctionDraft) {
        const draft = await request<AuctionDraftRecord>(
          `/api/drafts/auctions/${row.auctionDraft.id}/${kind}`,
          { method: "POST", body: JSON.stringify({ reason }) },
        );
        onUpdate({ ...row, auctionDraft: draft });
        setSavedVersion(draft.updatedAt);
      } else if (kind === "relist") {
        const next = await relistAuction(row.auction.id);
        onUpdate(next);
        navigate(`/auctions/${next.auction.id}/edit`);
      } else {
        const actions: Record<string, () => Promise<IAuction>> = {
          pause: () => pauseAuction(row.auction.id, reason!),
          resume: () => resumeAuction(row.auction.id),
          end: () => endAuction(row.auction.id),
          cancel: () => cancelAuction(row.auction.id, reason!),
          archive: () => archiveAuction(row.auction.id),
          "request-changes": () => requestAuctionChanges(row.auction.id, reason!),
          reject: () => rejectAuction(row.auction.id, reason!),
        };
        const auction = await actions[kind]();
        onUpdate({ ...row, auction });
        setSavedVersion(auction.updatedAt);
      }
      revalidate();
      await refreshReadiness();
    } catch (cause) {
      setError(errorMessage(cause));
      await refreshReadiness();
    } finally {
      setBusy("");
    }
  }
  const status = row.auctionDraft?.status ?? row.auction.status;
  const actions = row.auctionDraft
    ? status === "pending"
      ? ["request-changes", "reject"]
      : []
    : ((
        {
          pending_approval: ["request-changes", "reject"],
          changes_requested: ["cancel"],
          scheduled: ["cancel"],
          live: ["pause", "end", "cancel"],
          paused: ["resume", "end", "cancel"],
          ended: ["archive", "relist"],
          cancelled: ["archive", "relist"],
          rejected: ["archive", "relist"],
          archived: ["relist"],
          draft: ["archive"],
        } as Record<string, string[]>
      )[status] ?? []);
  const image = getListingThumbnail(row.listing);
  const location = row.listing.basicInformation.location;
  const hasCoordinates =
    typeof location.latitude === "number" &&
    typeof location.longitude === "number" &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    Math.abs(location.latitude) <= 90 &&
    Math.abs(location.longitude) <= 180;
  const title = row.listing.basicInformation.title || "Untitled property";
  const heading = sections.find((item) => item.id === section)!;
  const primarySave = dirty || !ready;
  return (
    <div className="preparation">
      <header className="preparation__hero">
        <div className="preparation__photo">
          {image ? <img src={image} alt={title} /> : <span>No property photo</span>}
        </div>
        <div>
          <p className="preparation__eyebrow">
            {isPreparation ? "Auction preparation" : "Auction management"}
          </p>
          <h1>{title}</h1>
          <p>
            {[location.address, location.city, location.state, location.zipcode]
              .filter(Boolean)
              .join(", ")}
          </p>
          <span className={`preparation__badge ${ready ? "is-ready" : ""}`}>
            {preparationStatus({ ...row, preparationReadiness: readiness ?? undefined })}
          </span>
        </div>
      </header>
      <nav className="preparation__steps" aria-label="Auction preparation sections">
        {sections.map((item, index) => (
          <button
            key={item.id}
            aria-current={section === item.id ? "step" : undefined}
            onClick={() => visit(item.id)}
          >
            <span>{index + 1}</span>
            <strong>{item.title}</strong>
            <small>{item.description}</small>
          </button>
        ))}
      </nav>
      {error ? (
        <div role="alert" className="preparation__error">
          {error}
        </div>
      ) : null}
      {notice ? (
        <p role="status" className="preparation__notice">
          {notice}
        </p>
      ) : null}
      {changedElsewhere ? (
        <div role="status" className="preparation__warning">
          This auction was updated. Reload its setup before saving or launching.{" "}
          <button onClick={reloadSetup} disabled={Boolean(busy)}>
            Reload setup
          </button>
        </div>
      ) : null}
      <main id={`preparation-${section}`} tabIndex={-1} className="preparation__section">
        <div className="preparation__sectionHeading">
          <div>
            <p className="preparation__eyebrow">
              Step {sections.findIndex((s) => s.id === section) + 1} of 4
            </p>
            <h2>{heading.title}</h2>
          </div>
          {section !== "launch" ? (
            <button onClick={() => visit("launch")}>View launch checklist</button>
          ) : null}
        </div>
        {section === "property" ? (
          <>
            <dl className="preparation__facts">
              <Fact
                label="Listing approval"
                value={
                  checks.find((c) => c.code === "listing_approved")?.satisfied
                    ? "Approved listing snapshot"
                    : checking
                      ? "Checking…"
                      : "Needs listing approval"
                }
              />
              <Fact
                label="Seller / owner"
                value={
                  verification?.authority.legalName ||
                  row.listing.contactInformation?.seller?.name ||
                  row.listingReview?.requestedBy?.username ||
                  row.listing.ownerAccountId
                }
              />
              <Fact label="Property type" value={row.listing.basicInformation.type} />
              <Fact
                label="Map location"
                value={hasCoordinates ? "Property coordinates available" : "Missing location data"}
              />
            </dl>
            <div className="preparation__callout">
              <h3>Current property information</h3>
              <p>{row.listing.description?.overview || "No property description provided."}</p>
              <p>
                {checks.find((c) => c.code === "auction_terms")?.satisfied
                  ? "Approved auction terms are available."
                  : "Auction terms must be included in the approved listing review."}
              </p>
              <button
                onClick={() => navigateSafely(`/messages?listingId=${row.auction.listingId}`)}
              >
                Review listing & terms
              </button>
            </div>
            {!hasCoordinates ? (
              <p className="preparation__warning">
                This property will not have a map marker until its actual location is corrected.
              </p>
            ) : null}
            <button
              aria-expanded={editingProperty}
              onClick={() => {
                if (!propertyDirty || window.confirm("Discard unsaved property corrections?"))
                  setEditingProperty((v) => !v);
              }}
            >
              {" "}
              {editingProperty
                ? "Close property corrections"
                : "Correct property details / location"}
            </button>
            {editingProperty ? (
              <>
                <p className="preparation__hint">
                  Corrections update the current operational listing. Changes here do not replace
                  the approved listing snapshot; use listing review for revised terms.
                </p>
                <ListingEditorSection
                  listing={row.listing}
                  allowPublish={false}
                  onDirtyChange={setPropertyDirty}
                  onUpdated={(listing) => {
                    onUpdate({ ...row, listing });
                    void refreshReadiness();
                    revalidate();
                  }}
                />
              </>
            ) : null}
          </>
        ) : null}
        <div hidden={section !== "verification"}>
          <p>Verify the seller’s right to sell, then accept the required property documents.</p>
          <LiquidationReview
            listingId={row.auction.listingId}
            embedded
            onUpdated={verificationUpdated}
          />
          <button onClick={() => navigateSafely(`/messages?listingId=${row.auction.listingId}`)}>
            Open seller conversation / request documents
          </button>
        </div>
        {section === "setup" ? (
          <>
            {locked ? (
              <p className="preparation__warning">
                {status === "pending" || status === "pending_approval"
                  ? "This setup is under review. Use “Return to preparation” below to make corrections."
                  : "Auction terms are locked in this state. Management actions remain available below."}
              </p>
            ) : null}
            <fieldset
              disabled={locked || Boolean(busy) || changedElsewhere}
              className="preparation__form"
            >
              <legend>Pricing</legend>
              <div className="preparation__grid">
                <Field label="Opening bid" hint="The first accepted bid can equal this amount.">
                  <input
                    aria-label="Opening bid"
                    inputMode="decimal"
                    value={form.startingBid}
                    onChange={(e) => change("startingBid", e.target.value)}
                  />
                </Field>
                <Field label="Bid increment" hint="Minimum increase after the first accepted bid.">
                  <input
                    aria-label="Bid increment"
                    inputMode="decimal"
                    value={form.increment}
                    onChange={(e) => change("increment", e.target.value)}
                  />
                </Field>
                <Field
                  label="Reserve price (optional)"
                  hint="No winner is declared below the reserve. Leave blank for no reserve."
                >
                  <input
                    aria-label="Reserve price (optional)"
                    inputMode="decimal"
                    value={form.reserve}
                    onChange={(e) => change("reserve", e.target.value)}
                  />
                </Field>
              </div>
              <p className="preparation__hint">
                Buy Now checkout is not available in this phase.
                {row.auction.rules.buyNowPrice != null
                  ? ` Existing configured price: ${money(row.auction.rules.buyNowPrice)}.`
                  : ""}
              </p>
              <h3>Schedule</h3>
              <p className="preparation__hint">
                Dates use your local time zone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
                A future start schedules the auction; a start at or before now publishes
                immediately.
              </p>
              <div className="preparation__grid">
                <Field label="Start date & time">
                  <input
                    aria-label="Start date & time"
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => change("startDate", e.target.value)}
                  />
                </Field>
                <Field label="End date & time">
                  <input
                    aria-label="End date & time"
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => change("endDate", e.target.value)}
                  />
                </Field>
              </div>
              <button
                type="button"
                onClick={() => {
                  const date = new Date();
                  const value = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16);
                  change("startDate", value);
                }}
              >
                Start now
              </button>
              <h3>Visibility & access</h3>
              <Field
                label="Auction visibility"
                hint="Private auctions are restricted to authorized accounts; bidder approval is still required."
              >
                <select
                  aria-label="Auction visibility"
                  value={form.isPrivate ? "private" : "public"}
                  onChange={(e) => change("isPrivate", e.target.value === "private")}
                >
                  <option value="public">Public auction</option>
                  <option value="private">Private auction</option>
                </select>
              </Field>
              {form.isPrivate ? (
                <Field
                  label="Authorized bidder account IDs"
                  hint="One account ID per line, or separated by commas."
                >
                  <textarea
                    aria-label="Authorized bidder account IDs"
                    rows={4}
                    value={form.authorized}
                    onChange={(e) => change("authorized", e.target.value)}
                  />
                </Field>
              ) : null}
            </fieldset>
          </>
        ) : null}
        {section === "launch" ? (
          <>
            <div className={`preparation__callout ${ready ? "is-ready" : ""}`}>
              <h3>
                {checking
                  ? "Checking readiness…"
                  : ready
                    ? "Ready to launch"
                    : "Needs attention before launch"}
              </h3>
              <p>
                {dirty
                  ? "The checklist includes your unsaved setup. Save changes before launching."
                  : ready
                    ? future
                      ? "This auction will be scheduled for the start time below."
                      : "This auction can begin accepting bids immediately."
                    : "Select an incomplete item to resolve it."}
              </p>
              {readinessError ? <p role="alert">{readinessError}</p> : null}
              <button disabled={checking || Boolean(busy)} onClick={() => void refreshReadiness()}>
                Refresh checklist
              </button>
            </div>
            {!readiness ? (
              <p className="preparation__warning">
                Verification could not be confirmed. Refresh the checklist before launch.
              </p>
            ) : null}
            <ul className="preparation__checklist">
              {checks.map((check) => (
                <li key={check.code}>
                  <button onClick={() => visit(destination(check.code))}>
                    <span className={check.satisfied ? "is-complete" : "is-blocked"}>
                      {check.satisfied ? "✓" : "!"}
                    </span>
                    <span>
                      {check.label}
                      <small>
                        {check.satisfied
                          ? "Complete"
                          : destination(check.code) === "setup"
                            ? "Needs attention · open auction setup"
                            : `Blocked · open ${destination(check.code)}`}
                      </small>
                    </span>
                    <span aria-hidden="true">→</span>
                  </button>
                </li>
              ))}
            </ul>
            <h3>Final auction configuration</h3>
            <dl className="preparation__facts">
              <Fact label="Opening bid" value={money(form.startingBid)} />
              <Fact label="Increment" value={money(form.increment)} />
              <Fact label="Reserve" value={form.reserve ? money(form.reserve) : "No reserve"} />
              <Fact
                label="Visibility"
                value={
                  form.isPrivate
                    ? `Private · ${accountIds(form.authorized).length} authorized accounts`
                    : "Public"
                }
              />
              <Fact label="Starts" value={when(form.startDate)} />
              <Fact label="Ends" value={when(form.endDate)} />
            </dl>
          </>
        ) : null}
      </main>
      {!isPreparation ? (
        <div className="preparation__callout">
          <h3>{preparationStatus(row)}</h3>
          <p>
            {row.auction.status === "scheduled"
              ? `Starts ${when(row.auction.startDate)}. Verification must remain complete for automatic activation.`
              : `Ends ${when(row.auction.endDate)}.`}
          </p>
          <button onClick={() => navigateSafely(`/auctions/${row.auction.id}/leaderboard`)}>
            View bids & activity
          </button>
        </div>
      ) : null}
      {actions.length ? (
        <details className="preparation__advanced">
          <summary>Advanced auction management</summary>
          <p>Use these actions for exceptions or changes to an existing auction.</p>
          <div>
            {actions.map((action) => (
              <button
                key={action}
                disabled={Boolean(busy) || dirty || propertyDirty}
                onClick={() => void advanced(action)}
              >
                {action === "request-changes"
                  ? "Return to preparation / request changes"
                  : action[0].toUpperCase() + action.slice(1)}
              </button>
            ))}
          </div>
        </details>
      ) : null}
      <footer className="preparation__footer">
        <div role="status">
          <strong>{busy || (dirty ? "Unsaved changes" : "Setup saved")}</strong>
          <small>
            {propertyDirty
              ? "Save property corrections before continuing."
              : checking
                ? "Checking launch requirements…"
                : ready
                  ? "Launch requirements complete"
                  : `${blockers.length} ${blockers.length === 1 ? "item needs" : "items need"} attention`}
          </small>
        </div>
        {section !== "launch" ? (
          <button
            disabled={Boolean(busy) || propertyDirty}
            onClick={() => visit(sections[sections.findIndex((s) => s.id === section) + 1].id)}
          >
            Continue →
          </button>
        ) : null}
        {!locked && (primarySave || !isPreparation) ? (
          <button
            className="preparation__primary"
            disabled={!dirty || Boolean(busy) || changedElsewhere || propertyDirty}
            onClick={() => void save()}
          >
            Save changes
          </button>
        ) : canLaunch && ready ? (
          <button
            className="preparation__primary"
            disabled={Boolean(busy) || checking || dirty || propertyDirty || changedElsewhere}
            onClick={() => (section === "launch" ? void launch() : visit("launch"))}
          >
            {section === "launch" ? launchLabel : "Review & launch"}
          </button>
        ) : isPreparation ? (
          <button disabled={Boolean(busy)} onClick={() => visit("launch")}>
            Resolve launch blockers
          </button>
        ) : null}
      </footer>
    </div>
  );
}
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="preparation__field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}
function Fact({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "Not provided"}</dd>
    </div>
  );
}
