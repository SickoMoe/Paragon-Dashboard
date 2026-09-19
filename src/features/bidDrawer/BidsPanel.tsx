import { useEffect, useState, type CSSProperties } from "react";
import Drawer from "../../core/components/Drawer";
import type {
  AuctionLeaderboardDTO,
  BidDTO,
} from "../auctions/services/auctionBidApi";
import { inputStyle, primaryBtn, secondaryBtn } from "../auctionDrawer/styles";

export function BidsPanel({
  onClose,
  loading,
  mutating = false,
  error,
  leaderboard,
  onSelectBid,
  onRecordBid,
  onVoidBid,
}: {
  onClose: () => void;
  loading: boolean;
  mutating?: boolean;
  error: string | null;
  leaderboard: AuctionLeaderboardDTO;
  onSelectBid: (bid: BidDTO) => void;
  onRecordBid?: (input: {
    bidderProfileId: string;
    amount: number;
    adminNote?: string;
  }) => void | Promise<void>;
  onVoidBid?: (bid: BidDTO) => void | Promise<void>;
}) {
  const minimum =
    Number(leaderboard.currentBid ?? leaderboard.openingBid ?? 0) +
    Number(leaderboard.incrementAmount ?? 0);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [bidderProfileId, setBidderProfileId] = useState("");
  const [amount, setAmount] = useState(String(minimum));
  const [adminNote, setAdminNote] = useState("");
  const bidHistory = [...(leaderboard.bids ?? []), ...(leaderboard.voidedBids ?? [])]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));

  useEffect(() => {
    if (!showRecordForm) setAmount(String(minimum));
  }, [minimum, showRecordForm]);

  const submit = async () => {
    if (!onRecordBid) return;
    await onRecordBid({
      bidderProfileId: bidderProfileId.trim(),
      amount: Number(amount),
      adminNote: adminNote.trim() || undefined,
    });
    setBidderProfileId("");
    setAdminNote("");
    setShowRecordForm(false);
  };

  const canSubmit =
    bidderProfileId.trim() &&
    Number.isFinite(Number(amount)) &&
    Number(amount) >= minimum;

  return (
    <Drawer open onClose={onClose} title="Bid management" size={460} zIndex={60}>
      <div style={styles.wrap}>
        <section style={styles.summary}>
          <Metric label="Current" value={money(leaderboard.currentBid)} />
          <Metric label="Opening" value={money(leaderboard.openingBid)} />
          <Metric label="Increment" value={money(leaderboard.incrementAmount)} />
        </section>

        {leaderboard.monitoring ? (
          <section style={styles.monitoring}>
            <div style={styles.monitoringHeader}>
              <strong style={styles.sectionTitle}>Auction access</strong>
              <span style={styles.visibilityBadge}>{leaderboard.monitoring.visibility}</span>
            </div>
            {leaderboard.monitoring.visibility === "private" ? (
              leaderboard.monitoring.authorizedUsers.length ? (
                <div style={styles.monitoringList}>
                  {leaderboard.monitoring.authorizedUsers.map((entry) => (
                    <div key={entry.accountId} style={styles.monitoringRow}>
                      <span><strong>{entry.username || entry.email || entry.accountId}</strong><small>{entry.verificationStatus?.replace(/_/g, " ") || "not verified"}</small></span>
                      <span style={entry.biddingEligibility ? styles.eligible : styles.ineligible}>{entry.biddingEligibility ? "Eligible" : "Ineligible"}</span>
                    </div>
                  ))}
                </div>
              ) : <div style={styles.muted}>No users have been selected for this private auction.</div>
            ) : <div style={styles.muted}>Anyone can discover this auction. Bidder eligibility is still enforced separately.</div>}
            {leaderboard.monitoring.participants.length ? (
              <>
                <div style={styles.monitoringDivider} />
                <div style={styles.muted}>Bidder verification and eligibility</div>
                <div style={styles.monitoringList}>
                  {leaderboard.monitoring.participants.map((entry) => (
                    <div key={entry.bidderProfileId} style={styles.monitoringRow}>
                      <span><strong>{entry.bidderProfileId}</strong><small>{entry.verificationStatus?.replace(/_/g, " ") || "legacy approval"}</small></span>
                      <span style={entry.biddingEligibility ? styles.eligible : styles.ineligible}>{entry.biddingEligibility ? "Eligible" : "Ineligible"}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </section>
        ) : null}

        <div style={styles.toolbar}>
          <div>
            <strong style={styles.sectionTitle}>Bid History</strong>
            <div style={styles.muted}>
              {(leaderboard.bids?.length ?? 0)} accepted
              {(leaderboard.voidedBids?.length ?? 0) > 0
                ? `, ${leaderboard.voidedBids?.length ?? 0} voided`
                : ""}
            </div>
          </div>
          {onRecordBid ? (
            <button
              type="button"
              style={showRecordForm ? secondaryBtn : primaryBtn}
              onClick={() => setShowRecordForm((current) => !current)}
            >
              {showRecordForm ? "Cancel" : "Record bid"}
            </button>
          ) : null}
        </div>

        {showRecordForm ? (
          <section style={styles.recordForm}>
            <label style={styles.field}>
              <span style={styles.label}>Bidder profile ID</span>
              <input
                style={inputStyle}
                value={bidderProfileId}
                onChange={(event) => setBidderProfileId(event.target.value)}
              />
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Bid amount</span>
              <input
                type="number"
                min={minimum}
                step={leaderboard.incrementAmount || 1}
                style={inputStyle}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
              <small style={styles.muted}>Minimum {money(minimum)}</small>
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Admin note</span>
              <textarea
                style={styles.textarea}
                value={adminNote}
                onChange={(event) => setAdminNote(event.target.value)}
              />
            </label>
            <button
              type="button"
              style={primaryBtn}
              disabled={!canSubmit || mutating}
              onClick={() => void submit()}
            >
              {mutating ? "Recording..." : "Confirm bid"}
            </button>
          </section>
        ) : null}

        {loading ? <div style={styles.muted}>Loading bids...</div> : null}
        {error ? <div style={styles.error}>{error}</div> : null}

        {!loading && !error && bidHistory.length === 0 ? (
          <div style={styles.empty}>No bid history yet.</div>
        ) : null}

        {!loading && !error && bidHistory.length > 0 ? (
          <div style={styles.list}>
            {bidHistory.map((bid) => (
              <BidRow
                key={bid.id}
                bid={bid}
                disabled={mutating}
                onSelect={() => onSelectBid(bid)}
                onVoid={
                  onVoidBid && bid.status !== "voided"
                    ? () => void onVoidBid(bid)
                    : undefined
                }
              />
            ))}
          </div>
        ) : null}
      </div>
    </Drawer>
  );
}

function BidRow({
  bid,
  disabled,
  onSelect,
  onVoid,
}: {
  bid: BidDTO;
  disabled: boolean;
  onSelect: () => void;
  onVoid?: () => void;
}) {
  const isAdmin = bid.source === "admin";
  const isAuto = bid.source === "auto";
  const isVoided = bid.status === "voided";

  return (
    <article
      style={{
        ...styles.row,
        ...(isAdmin ? styles.rowAdmin : null),
        ...(isVoided ? styles.rowVoided : null),
      }}
    >
      <button type="button" style={styles.rowMain} onClick={onSelect}>
        <span style={styles.rowTop}>
          <strong>{money(bid.amount)}</strong>
          <span>{formatDate(bid.createdAt)}</span>
        </span>
        <span style={styles.muted}>Bidder: {bid.bidderProfileId}</span>
        <span style={styles.badgeRow}>
          <span
            style={{
              ...styles.sourceBadge,
              ...(isAdmin ? styles.sourceBadgeAdmin : null),
              ...(isAuto ? styles.sourceBadgeAuto : null),
            }}
          >
            {formatSource(bid.source)}
          </span>
          <span style={isVoided ? styles.statusVoided : styles.statusAccepted}>
            {isVoided ? "Voided" : "Accepted"}
          </span>
        </span>
        {bid.adminNote ? (
          <span style={styles.note}>Admin note: {bid.adminNote}</span>
        ) : null}
        {isVoided ? (
          <span style={styles.voidReason}>
            Voided {formatDate(bid.voidedAt)}: {bid.voidReason || "No reason recorded"}
          </span>
        ) : null}
      </button>
      {onVoid ? (
        <button
          type="button"
          style={styles.voidButton}
          onClick={onVoid}
          disabled={disabled}
        >
          Void
        </button>
      ) : null}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metric}>
      <span style={styles.label}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function money(value: unknown) {
  const amount = Number(value ?? 0);
  return "$" + (Number.isFinite(amount) ? amount : 0).toLocaleString();
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function formatSource(source?: BidDTO["source"]) {
  if (source === "auto") return "AutoBid";
  if (source === "admin") return "Admin";
  if (source === "system") return "System";
  return "Manual";
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    marginTop: 12,
    display: "grid",
    gap: 14,
    color: "var(--dash-ink)",
    fontSize: 13,
  },
  summary: {
    paddingBottom: 14,
    borderBottom: "1px solid var(--dash-border)",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
  },
  metric: {
    display: "grid",
    gap: 4,
  },
  monitoring: {
    padding: 12,
    border: "1px solid var(--dash-border)",
    borderRadius: 8,
    display: "grid",
    gap: 10,
    background: "var(--dash-surface)",
  },
  monitoringHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  visibilityBadge: {
    padding: "3px 7px",
    border: "1px solid var(--dash-border)",
    borderRadius: 999,
    color: "var(--dash-muted)",
    fontSize: 10,
    fontWeight: 750,
    textTransform: "uppercase",
  },
  monitoringList: {
    display: "grid",
    gap: 7,
  },
  monitoringDivider: {
    height: 1,
    background: "var(--dash-border)",
  },
  monitoringRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  eligible: {
    color: "#235b43",
    fontSize: 11,
    fontWeight: 750,
  },
  ineligible: {
    color: "var(--dash-danger)",
    fontSize: 11,
    fontWeight: 750,
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
  },
  muted: {
    color: "var(--dash-muted)",
    fontSize: 12,
  },
  recordForm: {
    padding: 14,
    border: "1px solid var(--dash-border)",
    borderRadius: 8,
    display: "grid",
    gap: 12,
    background: "var(--dash-surface)",
  },
  field: {
    display: "grid",
    gap: 6,
  },
  label: {
    color: "var(--dash-muted)",
    fontSize: 11,
    fontWeight: 750,
    textTransform: "uppercase",
  },
  textarea: {
    ...inputStyle,
    minHeight: 72,
    paddingTop: 9,
    resize: "vertical",
  },
  list: {
    display: "grid",
    gap: 8,
  },
  row: {
    minWidth: 0,
    border: "1px solid var(--dash-border)",
    borderRadius: 8,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "stretch",
    overflow: "hidden",
    background: "var(--dash-card)",
  },
  rowAdmin: {
    borderColor: "rgba(24, 24, 27, 0.22)",
    background: "linear-gradient(0deg, rgba(24, 24, 27, 0.035), rgba(24, 24, 27, 0.035)), var(--dash-card)",
  },
  rowVoided: {
    opacity: 0.72,
    background: "var(--dash-surface)",
  },
  rowMain: {
    minWidth: 0,
    padding: 11,
    border: 0,
    display: "grid",
    gap: 4,
    background: "transparent",
    color: "var(--dash-ink)",
    cursor: "pointer",
    textAlign: "left",
  },
  rowTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    fontSize: 12,
  },
  note: {
    marginTop: 3,
    color: "var(--dash-muted)",
    fontSize: 12,
    fontStyle: "italic",
  },
  badgeRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  sourceBadge: {
    width: "fit-content",
    padding: "3px 7px",
    borderRadius: 999,
    background: "var(--dash-surface)",
    color: "var(--dash-muted)",
    fontSize: 11,
    fontWeight: 750,
  },
  sourceBadgeAdmin: {
    background: "#18181b",
    color: "#ffffff",
  },
  sourceBadgeAuto: {
    background: "rgba(35, 91, 67, 0.11)",
    color: "#235b43",
  },
  statusAccepted: {
    color: "#235b43",
    fontSize: 11,
    fontWeight: 750,
  },
  statusVoided: {
    color: "var(--dash-danger)",
    fontSize: 11,
    fontWeight: 750,
  },
  voidButton: {
    width: 58,
    border: 0,
    borderLeft: "1px solid var(--dash-border)",
    background: "transparent",
    color: "var(--dash-danger)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 750,
  },
  empty: {
    padding: "28px 12px",
    border: "1px dashed var(--dash-border)",
    borderRadius: 8,
    color: "var(--dash-muted)",
    textAlign: "center",
  },
  error: {
    padding: 10,
    borderRadius: 6,
    background: "rgba(178, 67, 67, 0.1)",
    color: "var(--dash-danger)",
    fontSize: 12,
    fontWeight: 700,
  },
  voidReason: {
    marginTop: 5,
    color: "var(--dash-danger)",
    fontSize: 12,
  },
};
