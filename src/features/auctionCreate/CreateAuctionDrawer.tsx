import { useState } from "react";
import { AuctionOverview } from "../auctions/types";
import { IAuction } from "../../interfaces/IAuction";
import { IListing } from "../../interfaces/IListing";
let tempCounter = 0;

export function makeTempId() {
  tempCounter += 1;
  return `temp-${tempCounter}`;
}

export function createOptimisticDraft(
  input: {
    listingId: string;
    startingBid?: number;
    rules?: { bidIncrement?: number };
    startDate?: string;
    endDate?: string;
  },
  listing: IListing
): AuctionOverview {
  const tempId = `draft-${Date.now()}`;

  const auction: IAuction = {
    id: tempId,
    listingId: input.listingId,
    listing,
    startingBid: input.startingBid ?? 0,
    rules: {
      bidIncrement: input.rules?.bidIncrement ?? 1000,
      currency: "USD",
    },
    roles: [],
    bids: [],
    isPrivate: false,
    status: "draft",
    startDate: input.startDate,
    endDate: input.endDate,
    createdBy: "optimistic",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    auction,
    listing,
    bid: {
      openingBid: auction.startingBid ?? 0,
      incrementAmount: auction.rules.bidIncrement,
      currentBid: 0,
      bidCount: 0,
    },
  };
}
const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
};

const modal: React.CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  width: "100%",
  maxWidth: 600,
  maxHeight: "90vh",
  overflowY: "auto",
  padding: 20,
  boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
};

const header: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 20,
};

const closeBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: 24,
  cursor: "pointer",
  lineHeight: 1,
};


export function CreateAuctionModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
onSubmit: (input: CreateAuctionInput) => void | Promise<void>}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
function handleSubmit(input: CreateAuctionInput) {
  onSubmit(input);
  onClose();
}

  return (
    <div style={overlay}>
      <div style={modal}>
        <header style={header}>
          <h3 style={{ margin: 0 }}>Create Auction</h3>
          <button onClick={onClose} style={closeBtn}>×</button>
        </header>

        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}

        <CreateAuctionForm
          onSubmit={handleSubmit}
          onCancel={onClose}
        />

        {loading && <div style={{ marginTop: 12 }}>Creating…</div>}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h4 style={{ margin: 0 }}>{title}</h4>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, color: "#6b7280" }}>{label}</span>
      {children}
    </label>
  );
}


export type CreateAuctionInput = {
  listingId: string;
  startingBid: number;
  bidIncrement: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  isPrivate: boolean;
  status: "draft" | "scheduled";
};

export function CreateAuctionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: CreateAuctionInput) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CreateAuctionInput>({
    listingId: "",
    startingBid: 0,
    bidIncrement: 1000,
    currency: "USD",
    isPrivate: false,
    status: "draft",
  });

  function update<K extends keyof CreateAuctionInput>(
    key: K,
    value: CreateAuctionInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canSubmit =
    form.listingId &&
    form.startingBid > 0 &&
    (!form.startDate || !form.endDate || form.startDate < form.endDate);

  return (
    <form
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        maxWidth: 520,
      }}
    >
      {/* Listing */}
      <Section title="Listing">
        <input
          placeholder="Listing ID"
          value={form.listingId}
          onChange={(e) => update("listingId", e.target.value)}
        />
      </Section>

      {/* Bidding */}
      <Section title="Bidding">
        <Field label="Starting Bid">
          <input
            type="number"
            min={0}
            value={form.startingBid}
            onChange={(e) =>
              update("startingBid", Number(e.target.value))
            }
          />
        </Field>

        <Field label="Bid Increment">
          <input
            type="number"
            min={1}
            value={form.bidIncrement}
            onChange={(e) =>
              update("bidIncrement", Number(e.target.value))
            }
          />
        </Field>

        <Field label="Currency">
          <select
            value={form.currency}
            onChange={(e) => update("currency", e.target.value)}
          >
            <option value="USD">USD</option>
          </select>
        </Field>
      </Section>

      {/* Schedule */}
      <Section title="Schedule">
        <Field label="Start Date">
          <input
            type="datetime-local"
            value={form.startDate ?? ""}
            onChange={(e) => update("startDate", e.target.value)}
          />
        </Field>

        <Field label="End Date">
          <input
            type="datetime-local"
            value={form.endDate ?? ""}
            onChange={(e) => update("endDate", e.target.value)}
          />
        </Field>
      </Section>

      {/* Visibility */}
      <Section title="Visibility">
        <label style={{ display: "flex", gap: 8 }}>
          <input
            type="checkbox"
            checked={form.isPrivate}
            onChange={(e) => update("isPrivate", e.target.checked)}
          />
          Private auction
        </label>
      </Section>

      {/* Status */}
      <Section title="Status">
        <select
          value={form.status}
          onChange={(e) =>
            update("status", e.target.value as "draft" | "scheduled")
          }
        >
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </Section>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12 }}>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => onSubmit(form)}
        >
          Create Auction
        </button>
      </div>
    </form>
  );
}