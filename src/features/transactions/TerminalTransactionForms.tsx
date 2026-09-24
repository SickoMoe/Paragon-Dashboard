import { useState } from "react";
import { type Transaction, label } from "./types";
const localDate = (value: string | null) =>
  value
    ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : "";
const iso = (value: string) => (value ? new Date(value).toISOString() : null);
const fieldNames: Record<string, string> = {
  closingDate: "Closing date",
  depositReceivedAt: "Deposit received date",
  depositAmount: "Deposit amount",
  depositDueAt: "Deposit deadline",
  agreementDueAt: "Signing deadline",
  agreementReadyAt: "Agreement prepared date",
  agreementSentAt: "Agreement sent date",
  agreementSignedAt: "Agreement signed date",
};
export function CorrectRecordForm({
  t,
  busy,
  dirty,
  save,
}: {
  t: Transaction;
  busy: boolean;
  dirty: (v: boolean) => void;
  save: (body: object) => Promise<boolean>;
}) {
  const fields = t.management?.correctionFields || [];
  const [field, setField] = useState(fields[0] || ""),
    [reason, setReason] = useState("");
  const currentValue = (key: string) =>
    key === "depositAmount"
      ? String(t.depositAmount ?? "")
      : localDate((t as unknown as Record<string, string | null>)[key]);
  const [value, setValue] = useState(() => currentValue(fields[0] || ""));
  if (!fields.length)
    return (
      <p>
        Historical corrections are unavailable. Refresh the transaction to load current permissions.
      </p>
    );
  return (
    <form
      onChange={() => dirty(true)}
      onSubmit={(e) => {
        e.preventDefault();
        void save({
          correctionReason: reason,
          [field]: field === "depositAmount" ? (value === "" ? null : Number(value)) : iso(value),
        });
      }}
    >
      <h2>Correct record</h2>
      <p>
        Fix a factual error while keeping this transaction {label(t.status).toLowerCase()}. Workflow
        states, the original auction result and terminal timestamps stay unchanged.
      </p>
      <p className="transaction-muted">
        The correction reason stays in the internal audit. Participants see corrected facts and a
        record-correction entry.
      </p>
      <fieldset disabled={busy}>
        <div className="transaction-grid">
          <label>
            Field to correct
            <select
              value={field}
              onChange={(e) => {
                setField(e.target.value);
                setValue(currentValue(e.target.value));
              }}
            >
              {fields.map((key) => (
                <option key={key} value={key}>
                  {fieldNames[key] || key}
                </option>
              ))}
            </select>
          </label>
          <label>
            Corrected value
            <input
              type={field === "depositAmount" ? "number" : "datetime-local"}
              min={field === "depositAmount" ? 0 : undefined}
              max={field === "depositAmount" ? t.winningAmount : undefined}
              step={field === "depositAmount" ? "0.01" : undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required={
                field === "depositReceivedAt" ||
                field === "agreementSignedAt" ||
                (field === "closingDate" && t.status === "completed")
              }
            />
          </label>
        </div>
        <label>
          Correction reason
          <textarea
            required
            maxLength={4000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <button disabled={busy || !reason.trim() || value === currentValue(field)}>
          Save record correction
        </button>
      </fieldset>
    </form>
  );
}
const resumePoints: Record<string, string> = {
  pending_agreement:
    "Prepare agreement — reset agreement and deposit to not ready/not due; closing not started.",
  agreement_in_progress:
    "Review agreement — shared agreement ready; deposit not due; closing not started.",
  deposit_due: "Collect deposit — agreement signed; deposit due; closing not started.",
  deposit_received:
    "Confirm deposit — agreement signed; deposit received or waived; closing not started.",
  closing_in_progress:
    "Resume closing — agreement signed; deposit received or waived; closing in progress or scheduled.",
};
export function ReopenTransactionForm({
  t,
  busy,
  dirty,
  save,
}: {
  t: Transaction;
  busy: boolean;
  dirty: (v: boolean) => void;
  save: (body: object) => Promise<boolean>;
}) {
  const [target, setTarget] = useState(""),
    [reason, setReason] = useState(""),
    [amount, setAmount] = useState(String(t.depositAmount ?? "")),
    [due, setDue] = useState(localDate(t.depositDueAt)),
    [received, setReceived] = useState(localDate(t.depositReceivedAt)),
    [deposit, setDeposit] = useState(t.depositStatus === "waived" ? "waived" : "received"),
    [closing, setClosing] = useState("in_progress"),
    [closingDate, setClosingDate] = useState(localDate(t.closingDate));
  const needsDeposit = ["deposit_due", "deposit_received", "closing_in_progress"].includes(target);
  const confirmedDeposit = ["deposit_received", "closing_in_progress"].includes(target);
  const agreementAvailable = t.documents.some(
    (d) => d.category === "purchase_agreement" && d.visibility === "participants",
  );
  return (
    <form
      onChange={() => dirty(true)}
      onSubmit={(e) => {
        e.preventDefault();
        if (
          !window.confirm(
            `Reopen this ${label(t.status).toLowerCase()} transaction at ${label(target).toLowerCase()}? Current terminal dates and reason will move into history, and both participants will be notified.`,
          )
        )
          return;
        void save({
          targetStatus: target,
          reason,
          confirmed: true,
          ...(needsDeposit
            ? { depositAmount: amount === "" ? null : Number(amount), depositDueAt: iso(due) }
            : {}),
          ...(confirmedDeposit
            ? {
                depositStatus: deposit,
                depositReceivedAt: deposit === "received" ? iso(received) : null,
              }
            : {}),
          ...(target === "closing_in_progress"
            ? { closingStatus: closing, closingDate: iso(closingDate) }
            : {}),
        });
      }}
    >
      <h2>Reopen transaction</h2>
      <p className="transaction-warning">
        This restarts the closing workflow. Terminal timestamps and the cancellation/failure reason
        will be cleared from the active record and preserved in the audit history. The auction
        winner and price will not change.
      </p>
      <p>
        The reopening reason and full changes are internal. Participants see that closing reopened
        and its new status, and receive a notification.
      </p>
      <fieldset disabled={busy}>
        <label>
          Resume point
          <select required value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">Choose where to resume</option>
            {Object.keys(resumePoints).map((key) => (
              <option
                key={key}
                value={key}
                disabled={key !== "pending_agreement" && !agreementAvailable}
              >
                {label(key)}
                {key !== "pending_agreement" && !agreementAvailable
                  ? " (shared agreement required)"
                  : ""}
              </option>
            ))}
          </select>
        </label>
        {target ? <p role="status">{resumePoints[target]}</p> : null}
        <p className="transaction-muted">
          Confirm the selected milestones reflect the actual agreement and deposit. Earlier resume
          points clear later milestone details from the active record; their previous values remain
          in history.
        </p>
        {needsDeposit ? (
          <div className="transaction-grid">
            {confirmedDeposit ? (
              <label>
                Confirmed deposit state
                <select value={deposit} onChange={(e) => setDeposit(e.target.value)}>
                  <option value="received">Received</option>
                  <option value="waived">Waived</option>
                </select>
              </label>
            ) : null}
            <label>
              Deposit amount ({t.currency})
              <input
                type="number"
                step="0.01"
                min={deposit === "waived" && target !== "deposit_due" ? 0 : 0.01}
                max={t.winningAmount}
                required={target === "deposit_due" || deposit === "received"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label>
              Deposit deadline
              <input
                type="datetime-local"
                required={target === "deposit_due"}
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </label>
            {confirmedDeposit && deposit === "received" ? (
              <label>
                Deposit received date
                <input
                  type="datetime-local"
                  value={received}
                  onChange={(e) => setReceived(e.target.value)}
                />
                <small>A blank date records confirmation now.</small>
              </label>
            ) : null}
          </div>
        ) : null}
        {target === "closing_in_progress" ? (
          <div className="transaction-grid">
            <label>
              Resume closing as
              <select value={closing} onChange={(e) => setClosing(e.target.value)}>
                <option value="in_progress">In progress</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </label>
            <label>
              Closing date
              <input
                type="datetime-local"
                required={closing === "scheduled"}
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
              />
            </label>
          </div>
        ) : null}
        <label>
          Reopening reason
          <textarea
            required
            maxLength={4000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <button disabled={busy || !target || !reason.trim()}>Reopen transaction</button>
      </fieldset>
    </form>
  );
}
