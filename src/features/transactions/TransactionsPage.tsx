import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { request } from "../../core/api/request";
import { appEnv } from "../../core/config/env";
import { resolveListingMediaUrl } from "../auctions/utils/listingMedia";
import { type Transaction, type TransactionDocument, label, money, when } from "./types";
import "./transactions.css";
const base = "/api/transactions";
const terminal = (t: Transaction) => ["completed", "cancelled", "failed"].includes(t.status);
export default function TransactionsPage() {
  const [items, setItems] = useState<Transaction[] | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("active");
  const [params] = useSearchParams();
  const auctionId = params.get("auction");
  const load = useCallback(async () => {
    try {
      setItems(
        await request<Transaction[]>(
          base + "/manage" + (auctionId ? "?auctionId=" + encodeURIComponent(auctionId) : ""),
        ),
      );
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [auctionId]);
  useEffect(() => {
    void load();
  }, [load]);
  async function reconcile() {
    setBusy(true);
    try {
      const result = await request<{ errors: { auctionId: string; message: string }[] }>(
        base + "/reconcile",
        { method: "POST" },
      );
      await load();
      if (result.errors.length)
        setError(result.errors.map((e) => `${e.auctionId}: ${e.message}`).join("\n"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const visible = items?.filter(
    (t) =>
      (filter === "all" || (filter === "active" ? !terminal(t) : t.status === filter)) &&
      [t.property.title, t.property.address, t.buyer?.name, t.seller?.name]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <main className="transactions">
      <header>
        <h1>Transactions & closing</h1>
        <p>Manage completed auction results, agreements, deposits and closing.</p>
      </header>
      <div className="transaction-toolbar">
        <label>
          Find a transaction
          <input
            type="search"
            placeholder="Property, buyer or seller"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Status
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {["active", "all", "completed", "cancelled", "failed"].map((v) => (
              <option key={v} value={v}>
                {label(v)}
              </option>
            ))}
          </select>
        </label>
        <button disabled={busy} onClick={load}>
          Refresh
        </button>
        <button disabled={busy} onClick={reconcile}>
          {busy ? "Checking results…" : "Reconcile ended auctions"}
        </button>
      </div>
      {error ? <p role="alert">{error}</p> : null}
      {!items ? (
        <p role="status">Loading transactions…</p>
      ) : !visible?.length ? (
        <section className="transaction-panel">
          <h2>No matching transactions</h2>
          <p>
            Successful finalized auctions create a transaction automatically. Use Reconcile if an
            ended auction needs another finalization attempt.
          </p>
        </section>
      ) : (
        visible.map((t) => (
          <article key={t.transactionId} className="transaction-card">
            {t.property.image ? (
              <img src={resolveListingMediaUrl(t.property.image)} alt="" />
            ) : (
              <span className="transaction-muted">No property photo</span>
            )}
            <div>
              <span className="transaction-status">{label(t.status)}</span>
              <h2>{t.property.title || t.property.address}</h2>
              <strong>{money(t.winningAmount, t.currency)}</strong>
              <p>
                {t.buyer?.name} → {t.seller?.name}
              </p>
              <p>{t.nextAction}</p>
            </div>
            <Link className="transaction-link" to={`/transactions/${t.transactionId}`}>
              Manage closing →
            </Link>
          </article>
        ))
      )}
    </main>
  );
}
export function TransactionWorkspace() {
  const { transactionId } = useParams();
  const [t, setT] = useState<Transaction | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [section, setSection] = useState("overview"),
    [dirty, setDirty] = useState(false);
  const url = base + "/" + encodeURIComponent(transactionId || "");
  const load = useCallback(async () => {
    try {
      setT(await request<Transaction>(url));
      setError("");
      setDirty(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [url]);
  useEffect(() => {
    setT(null);
    void load();
  }, [load]);
  useEffect(() => {
    if (!dirty && !busy) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, busy]);
  async function action(path: string, body: object, method = "POST"): Promise<boolean> {
    if (!t) return false;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      setT(
        await request<Transaction>(url + path, {
          method,
          body: JSON.stringify({ ...body, revision: t.revision }),
        }),
      );
      setDirty(false);
      setNotice("Saved. Participants can see the updated closing progress.");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function changeSection(next: string) {
    if (dirty && !window.confirm("Discard unsaved changes in this section?")) return;
    setDirty(false);
    setSection(next);
  }
  async function download(d: TransactionDocument) {
    setBusy(true);
    try {
      const headers = new Headers();
      if (appEnv.devAdminHeadersEnabled) headers.set("x-dev-admin", "1");
      const res = await fetch(`${url}/documents/${d.documentId}/download`, {
        credentials: "include",
        headers,
      });
      if (!res.ok) throw new Error("Document unavailable or access denied.");
      const blob = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = blob;
      a.download = d.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blob), 1000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="transactions">
      <Link
        to="/transactions"
        onClick={(e) => {
          if (dirty && !window.confirm("Discard unsaved changes?")) e.preventDefault();
        }}
      >
        ← Transactions
      </Link>
      {error ? (
        <p role="alert">
          {error}{" "}
          <button
            disabled={busy}
            onClick={() => {
              if (!dirty || window.confirm("Refresh and discard unsaved changes?")) void load();
            }}
          >
            Refresh transaction
          </button>
        </p>
      ) : null}
      {notice ? <p role="status">{notice}</p> : null}
      {!t ? (
        <p role="status">{error ? "Transaction unavailable." : "Loading closing workspace…"}</p>
      ) : (
        <>
          <header>
            <h1>{t.property.title || t.property.address}</h1>
            <span className="transaction-status">{label(t.status)}</span>{" "}
            <strong>{money(t.winningAmount, t.currency)}</strong>
          </header>
          <div className="transaction-next">
            <strong>Next action</strong>
            <p>{t.nextAction}</p>
          </div>
          <nav className="transaction-tabs" aria-label="Closing sections">
            {["overview", "agreement", "deposit", "closing", "timeline"].map((s) => (
              <button
                key={s}
                disabled={busy}
                aria-current={section === s ? "page" : undefined}
                onClick={() => changeSection(s)}
              >
                {label(s)}
              </button>
            ))}
          </nav>
          <section className="transaction-panel">
            {section === "overview" ? (
              <>
                <h2>Finalized auction result</h2>
                <dl className="transaction-facts">
                  <Fact title="Winning amount" value={money(t.winningAmount, t.currency)} />
                  <Fact title="Result finalized" value={when(t.origin.finalizedAt)} />
                  <Fact
                    title="Reserve"
                    value={
                      t.origin.reservePrice == null
                        ? "No reserve"
                        : t.origin.reserveMet
                          ? "Satisfied"
                          : "Not satisfied"
                    }
                  />
                  <Fact
                    title="Property"
                    value={[
                      t.property.address,
                      t.property.city,
                      t.property.state,
                      t.property.zipcode,
                    ].join(", ")}
                  />
                  <Fact
                    title="Buyer"
                    value={`${t.buyer?.name || "Unavailable"} · ${t.buyer?.email || ""}`}
                  />
                  <Fact
                    title="Seller"
                    value={`${t.seller?.name || "Unavailable"} · ${t.seller?.email || ""}`}
                  />
                </dl>
                <Link to={`/auctions/${t.auctionId}`}>Open original auction</Link>
                <details>
                  <summary>Origin references</summary>
                  <p>Auction: {t.auctionId}</p>
                  <p>Winning bid: {t.winningBidId}</p>
                  <p>Transaction: {t.transactionId}</p>
                  <p>
                    The original winner and price are fixed. Result corrections never silently
                    select a replacement buyer.
                  </p>
                </details>
                {t.resultCorrections?.length ? (
                  <p className="transaction-warning">
                    Result invalidated: {t.resultCorrections[0].reason}
                  </p>
                ) : (
                  <ResultCorrection
                    busy={busy}
                    save={(body) => action("/result-correction", body)}
                  />
                )}
              </>
            ) : null}
            {["agreement", "deposit", "closing"].includes(section) ? (
              <MilestoneForm
                key={`${t.revision}:${section}`}
                t={t}
                section={section}
                busy={busy}
                dirty={setDirty}
                save={(body, correction) =>
                  action(correction ? "/corrections" : "", body, correction ? "POST" : "PATCH")
                }
              />
            ) : null}
            {section === "timeline" ? (
              <>
                <h2>History & notes</h2>
                <NoteForm
                  key={t.revision}
                  busy={busy}
                  dirty={setDirty}
                  save={(body) => action("/notes", body)}
                />
                <ol className="transaction-timeline">
                  {[...t.timeline].reverse().map((e) => (
                    <li key={e.eventId}>
                      <strong>{label(e.type)}</strong>{" "}
                      {e.visibility === "internal" ? (
                        <span className="transaction-status">Internal</span>
                      ) : null}
                      <br />
                      <small>
                        {when(e.at)} · {e.actor}
                      </small>
                      {typeof e.details.text === "string" ? <p>{e.details.text}</p> : null}
                      {typeof e.details.reason === "string" ? <p>{e.details.reason}</p> : null}
                      {e.details.changes ? (
                        <details>
                          <summary>Milestone changes</summary>
                          <ul>
                            {Object.entries(
                              e.details.changes as Record<string, { from: unknown; to: unknown }>,
                            ).map(([key, v]) => (
                              <li key={key}>
                                {label(key.replace(/([a-z])([A-Z])/g, "$1 $2"))}:{" "}
                                {String(v.from ?? "Not set")} → {String(v.to ?? "Not set")}
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </>
            ) : null}
          </section>
          {["agreement", "deposit", "closing"].includes(section) ? (
            <DocumentManager
              key={`${t.revision}:${section}`}
              t={t}
              section={section}
              busy={busy}
              unsavedMilestones={dirty}
              setBusy={setBusy}
              setError={setError}
              accept={setT}
              download={download}
              action={action}
            />
          ) : null}
        </>
      )}
    </main>
  );
}
function Fact({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <dt>{title}</dt>
      <dd>{value}</dd>
    </div>
  );
}
const localDate = (value: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
function MilestoneForm({
  t,
  section,
  busy,
  dirty,
  save,
}: {
  t: Transaction;
  section: string;
  busy: boolean;
  dirty: (v: boolean) => void;
  save: (body: object, correction: boolean) => Promise<boolean>;
}) {
  const [agreement, setAgreement] = useState(t.agreementStatus),
    [agreementDue, setAgreementDue] = useState(localDate(t.agreementDueAt)),
    [deposit, setDeposit] = useState(t.depositStatus),
    [amount, setAmount] = useState(t.depositAmount == null ? "" : String(t.depositAmount)),
    [due, setDue] = useState(localDate(t.depositDueAt)),
    [received, setReceived] = useState(localDate(t.depositReceivedAt)),
    [closing, setClosing] = useState(t.closingStatus),
    [closingDate, setClosingDate] = useState(localDate(t.closingDate)),
    [reason, setReason] = useState(""),
    [correction, setCorrection] = useState(false),
    [correctionReason, setCorrectionReason] = useState("");
  const locked = terminal(t) && !correction;
  const iso = (v: string) => (v ? new Date(v).toISOString() : null);
  const body = () => ({
    ...(section === "agreement"
      ? { agreementStatus: agreement, agreementDueAt: iso(agreementDue) }
      : section === "deposit"
        ? {
            depositStatus: deposit,
            depositAmount: amount === "" ? null : Number(amount),
            depositDueAt: iso(due),
            depositReceivedAt: iso(received),
            reason,
          }
        : { closingStatus: closing, closingDate: iso(closingDate) }),
    ...(correction
      ? { correctionReason, status: t.status === "completed" ? "completed" : "active" }
      : {}),
  });
  return (
    <>
      <h2>{label(section)}</h2>
      {terminal(t) ? (
        <div className="transaction-warning">
          <p>
            This transaction is locked. Operational corrections require a reason and remain in the
            audit history.
          </p>
          <label>
            <span>
              <input
                type="checkbox"
                checked={correction}
                onChange={(e) => setCorrection(e.target.checked)}
              />{" "}
              Make an admin correction
            </span>
          </label>
          {correction ? (
            <label>
              Correction reason
              <textarea
                value={correctionReason}
                onChange={(e) => {
                  setCorrectionReason(e.target.value);
                  dirty(true);
                }}
              />
            </label>
          ) : null}
        </div>
      ) : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save(body(), correction);
        }}
        onChange={() => dirty(true)}
      >
        <fieldset disabled={busy || locked}>
          <div className="transaction-grid">
            {section === "agreement" ? (
              <>
                <label>
                  Agreement status
                  <select value={agreement} onChange={(e) => setAgreement(e.target.value)}>
                    {["not_ready", "ready", "sent", "signed"].map((v) => (
                      <option key={v} value={v}>
                        {label(v)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Signing deadline
                  <input
                    type="datetime-local"
                    value={agreementDue}
                    onChange={(e) => setAgreementDue(e.target.value)}
                  />
                </label>
              </>
            ) : section === "deposit" ? (
              <>
                <label>
                  Deposit status
                  <select value={deposit} onChange={(e) => setDeposit(e.target.value)}>
                    {["not_due", "due", "received", "waived"].map((v) => (
                      <option key={v} value={v}>
                        {label(v)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Deposit amount ({t.currency})
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    max={t.winningAmount}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </label>
                <label>
                  Deposit deadline
                  <input
                    type="datetime-local"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                  />
                </label>
                <label>
                  Received date
                  <input
                    type="datetime-local"
                    value={received}
                    onChange={(e) => setReceived(e.target.value)}
                  />
                  <small>When marking received, a blank date uses the current time.</small>
                </label>
                {deposit === "waived" ? (
                  <label>
                    Waiver reason
                    <textarea required value={reason} onChange={(e) => setReason(e.target.value)} />
                  </label>
                ) : null}
              </>
            ) : (
              <>
                <label>
                  Closing status
                  <select value={closing} onChange={(e) => setClosing(e.target.value)}>
                    {["not_started", "in_progress", "scheduled", "completed"].map((v) => (
                      <option key={v} value={v}>
                        {label(v)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Closing date
                  <input
                    type="datetime-local"
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                  />
                </label>
              </>
            )}
          </div>
          <p className="transaction-muted">
            {section === "agreement"
              ? "Upload the purchase agreement below before recording it ready, sent or signed. Signature milestones are recorded manually."
              : section === "deposit"
                ? "Record deposits after confirming receipt outside Paragon. A signed agreement is required."
                : "Closing requires a signed agreement and a received or waived deposit."}
          </p>
          <button
            className="transaction-primary"
            disabled={busy || locked || (correction && !correctionReason.trim())}
          >
            {busy ? "Saving…" : `Save ${section}`}
          </button>
        </fieldset>
      </form>
      {section === "closing" && !locked ? (
        <div className="transaction-actions">
          <button
            disabled={
              busy ||
              t.closingStatus !== "completed" ||
              Boolean(correction && !correctionReason.trim())
            }
            onClick={() =>
              void save(
                { status: "completed", ...(correction ? { correctionReason } : {}) },
                correction,
              )
            }
          >
            Complete transaction
          </button>
        </div>
      ) : null}
      {section === "closing" && !terminal(t) ? (
        <details>
          <summary>Cancel or fail this transaction</summary>
          <label>
            Reason visible to participants
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                dirty(true);
              }}
              maxLength={4000}
            />
          </label>
          <div className="transaction-actions">
            <button
              disabled={busy || !reason.trim()}
              onClick={() => void save({ status: "cancelled", reason }, false)}
            >
              Cancel transaction
            </button>
            <button
              disabled={busy || !reason.trim()}
              onClick={() => void save({ status: "failed", reason }, false)}
            >
              Fail transaction
            </button>
          </div>
        </details>
      ) : null}
    </>
  );
}
function NoteForm({
  busy,
  dirty,
  save,
}: {
  busy: boolean;
  dirty: (v: boolean) => void;
  save: (v: object) => Promise<boolean>;
}) {
  const [text, setText] = useState(""),
    [visibility, setVisibility] = useState("participants");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save({ text, visibility });
      }}
    >
      <fieldset disabled={busy}>
        <label>
          Note
          <textarea
            required
            maxLength={4000}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              dirty(true);
            }}
          />
        </label>
        <div className="transaction-actions">
          <label>
            Visible to
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <option value="participants">Buyer, seller and team</option>
              <option value="internal">Team only</option>
            </select>
          </label>
          <button disabled={!text.trim() || busy}>Add note</button>
        </div>
      </fieldset>
    </form>
  );
}
function ResultCorrection({
  busy,
  save,
}: {
  busy: boolean;
  save: (v: object) => Promise<boolean>;
}) {
  const [reason, setReason] = useState("");
  return (
    <details>
      <summary>Correct an invalid finalized result</summary>
      <p>
        Invalidating this result fails its transaction and notifies the participants. The original
        bid, buyer and winning amount remain in the record. No replacement transaction is created.
      </p>
      <label>
        Result correction reason
        <textarea value={reason} maxLength={4000} onChange={(e) => setReason(e.target.value)} />
      </label>
      <button
        disabled={busy || !reason.trim()}
        onClick={() => {
          if (window.confirm("Invalidate this finalized result and fail the transaction?"))
            void save({ reason });
        }}
      >
        Invalidate result & fail transaction
      </button>
    </details>
  );
}
function DocumentManager({
  unsavedMilestones,
  t,
  section,
  busy,
  setBusy,
  setError,
  accept,
  download,
  action,
}: {
  t: Transaction;
  section: string;
  busy: boolean;
  unsavedMilestones: boolean;
  setBusy: (v: boolean) => void;
  setError: (v: string) => void;
  accept: (t: Transaction) => void;
  download: (d: TransactionDocument) => void;
  action: (path: string, body: object, method?: string) => Promise<boolean>;
}) {
  const [file, setFile] = useState<File | null>(null),
    [category, setCategory] = useState(
      section === "agreement"
        ? "purchase_agreement"
        : section === "deposit"
          ? "earnest_receipt"
          : "closing",
    ),
    [visibility, setVisibility] = useState("participants"),
    [progress, setProgress] = useState(0),
    [reason, setReason] = useState("");
  const input = useRef<HTMLInputElement>(null);
  async function upload() {
    if (!file || unsavedMilestones) return;
    if (
      file.size > 10 * 1024 * 1024 ||
      !["application/pdf", "image/jpeg", "image/png"].includes(file.type)
    ) {
      setError("Choose a PDF, JPG or PNG up to 10 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await new Promise<Transaction>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${base}/${t.transactionId}/documents`);
        xhr.withCredentials = true;
        xhr.timeout = 120000;
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.setRequestHeader(
          "X-Document-Metadata",
          encodeURIComponent(
            JSON.stringify({
              filename: file.name,
              category,
              visibility,
              revision: t.revision,
              correctionReason: reason,
            }),
          ),
        );
        if (appEnv.devAdminHeadersEnabled) {
          xhr.setRequestHeader("x-dev-admin", "1");
          xhr.setRequestHeader("x-dev-session-id", "dashboard-dev");
        }
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onerror = () => reject(new Error("Upload failed. Retry the selected document."));
        xhr.ontimeout = () => reject(new Error("Upload timed out. Retry the selected document."));
        xhr.onload = () => {
          try {
            const result = JSON.parse(xhr.responseText);
            if (xhr.status < 200 || xhr.status >= 300)
              throw new Error(result.error || "Upload failed.");
            resolve(result);
          } catch (e) {
            reject(e);
          }
        };
        xhr.send(file);
      });
      accept(data);
      setFile(null);
      if (input.current) input.current.value = "";
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="transaction-panel">
      <h2>Transaction documents</h2>
      <p className="transaction-muted">
        Agreement and closing files are stored separately from pre-auction due diligence. Internal
        files can only be opened by the team.
      </p>
      {unsavedMilestones ? (
        <p role="status">Save your milestone changes before changing documents.</p>
      ) : null}
      {t.documents.map((d) => (
        <div key={d.documentId} className="transaction-document">
          <div>
            <strong>{d.filename}</strong>
            <small>
              {label(d.category)} · {d.visibility === "internal" ? "Team only" : "Participants"} ·{" "}
              {when(d.uploadedAt)}
            </small>
          </div>
          <div className="transaction-actions">
            <button disabled={busy} onClick={() => download(d)}>
              Download
            </button>
            <button
              disabled={busy || unsavedMilestones}
              onClick={() => {
                const reason = window.prompt("Reason for changing document visibility");
                if (reason?.trim())
                  void action(
                    `/documents/${d.documentId}`,
                    {
                      visibility: d.visibility === "internal" ? "participants" : "internal",
                      reason,
                      correctionReason: reason,
                    },
                    "PATCH",
                  );
              }}
            >
              Change access
            </button>
            <button
              disabled={busy || unsavedMilestones}
              onClick={() => {
                const reason = window.prompt(
                  "Reason for withdrawing this document (history is retained)",
                );
                if (reason?.trim())
                  void action(
                    `/documents/${d.documentId}`,
                    { remove: true, reason, correctionReason: reason },
                    "PATCH",
                  );
              }}
            >
              Withdraw
            </button>
          </div>
        </div>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void upload();
        }}
      >
        <fieldset disabled={busy || unsavedMilestones}>
          <div className="transaction-grid">
            <label>
              Document
              <input
                ref={input}
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <label>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {[
                  "purchase_agreement",
                  "addendum",
                  "earnest_receipt",
                  "escrow",
                  "title",
                  "settlement",
                  "closing",
                  "other",
                ].map((c) => (
                  <option key={c} value={c}>
                    {label(c)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Access
              <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                <option value="participants">Buyer, seller and team</option>
                <option value="internal">Team only</option>
              </select>
            </label>
            {terminal(t) ? (
              <label>
                Correction reason for a locked transaction
                <textarea required value={reason} onChange={(e) => setReason(e.target.value)} />
              </label>
            ) : null}
          </div>
          <div className="transaction-actions">
            <button disabled={busy || !file || Boolean(terminal(t) && !reason.trim())}>
              Upload document
            </button>
            {busy && file ? (
              <progress value={progress} max={100} aria-label="Document upload progress" />
            ) : null}
          </div>
        </fieldset>
      </form>
    </section>
  );
}
