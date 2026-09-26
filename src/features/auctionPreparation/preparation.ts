import type { AuctionOverview } from "../auctions/types";

export type Check = { code: string; label: string; satisfied: boolean };
export type Readiness = { ready: boolean; checks: Check[]; blockers: Check[] };
export type Section = "property" | "verification" | "setup" | "launch";
export type Setup = {
  startingBid: string;
  increment: string;
  reserve: string;
  startDate: string;
  endDate: string;
  isPrivate: boolean;
  authorized: string;
};
export const localDate = (value?: string) => {
  if (!value || !Number.isFinite(Date.parse(value))) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export function setupFor(row: AuctionOverview): Setup {
  const config = row.auctionDraft?.payload ?? row.auction;
  return {
    startingBid: config.startingBid == null ? "" : String(config.startingBid),
    increment: config.rules?.bidIncrement == null ? "" : String(config.rules.bidIncrement),
    reserve: config.rules?.reservePrice == null ? "" : String(config.rules.reservePrice),
    startDate: localDate(config.startDate),
    endDate: localDate(config.endDate),
    isPrivate: Boolean(config.isPrivate),
    authorized: (config.authorizedAccountIds ?? []).join("\n"),
  };
}
export const accountIds = (value: string) => [
  ...new Set(
    value
      .split(/[\n,]/)
      .map((id) => id.trim())
      .filter(Boolean),
  ),
];
export function configurationChecks(form: Setup, now = Date.now()): Check[] {
  const positive = (value: string) =>
    value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) > 0;
  return [
    {
      code: "starting_bid",
      label: "Opening bid configured",
      satisfied: positive(form.startingBid),
    },
    { code: "increment", label: "Bid increment configured", satisfied: positive(form.increment) },
    {
      code: "start_date",
      label: "Valid start date",
      satisfied: Number.isFinite(Date.parse(form.startDate)),
    },
    {
      code: "end_date",
      label: "End follows start and is in the future",
      satisfied: Date.parse(form.endDate) > Math.max(Date.parse(form.startDate), now),
    },
    {
      code: "reserve",
      label: "Reserve is absent or at least the opening bid",
      satisfied:
        !form.reserve.trim() ||
        (positive(form.reserve) && Number(form.reserve) >= Number(form.startingBid)),
    },
    {
      code: "private_access",
      label: "Private auction has authorized bidders",
      satisfied: !form.isPrivate || accountIds(form.authorized).length > 0,
    },
  ];
}
export function destination(code: string): Section {
  if (code === "listing_approved" || code === "auction_terms" || code === "listingId")
    return "property";
  if (code === "authority_verified" || code.startsWith("document:")) return "verification";
  return "setup";
}
export function preparationStatus(row: AuctionOverview, now = Date.now()) {
  if (row.auctionDraft?.status === "rejected") return "Rejected";
  const status = row.auction.status;
  if (!row.auctionDraft && !["draft", "pending_approval", "changes_requested"].includes(status)) {
    return status === "scheduled" && row.preparationReadiness && !row.preparationReadiness.ready
      ? "Scheduled · blocked"
      : status[0].toUpperCase() + status.slice(1);
  }
  const readiness = row.preparationReadiness;
  if (!readiness) return "Check readiness";
  const missing = readiness.checks.filter((check) => !check.satisfied);
  if (missing.some((c) => c.code === "listing_approved")) return "Needs listing approval";
  if (missing.some((c) => c.code === "authority_verified")) return "Needs authority verification";
  if (missing.some((c) => c.code.startsWith("document:") || c.code === "auction_terms"))
    return "Needs documents / terms";
  if (
    missing.length ||
    !readiness.ready ||
    configurationChecks(setupFor(row), now).some((c) => !c.satisfied)
  )
    return "Needs auction setup";
  return Date.parse(row.auction.startDate ?? "") > now ? "Ready to schedule" : "Ready to publish";
}

export function checkGuidance(code: string): { title: string; detail: string; action: string } {
  if (code === "listing_approved")
    return {
      title: "Approve the listing",
      detail:
        "Review the saved property or pending seller submission and approve it for this auction.",
      action: "Review & approve listing",
    };
  if (code === "auction_terms")
    return {
      title: "Review the auction terms",
      detail:
        "The approved listing needs auction terms. Review and save the terms here before launch.",
      action: "Review listing & terms",
    };
  if (code === "authority_verified")
    return {
      title: "Verify seller authority",
      detail: "Confirm the seller’s right to sell this property.",
      action: "Verify seller authority",
    };
  if (code.startsWith("document:"))
    return {
      title: `Accept the ${code.slice(9).replace(/_/g, " ")} document`,
      detail: "Review the uploaded file in Verification, or request it from the seller.",
      action: "Review required documents",
    };
  const fields: Record<string, string> = {
    starting_bid: "Set the opening bid",
    increment: "Set the bid increment",
    start_date: "Choose the start time",
    end_date: "Choose a future end time",
    reserve: "Check the reserve",
    private_access: "Select authorized bidders",
    listingId: "Choose a property",
  };
  return {
    title: fields[code] || "Complete auction setup",
    detail:
      code === "end_date"
        ? "The auction must end after its start time and later than now."
        : "Update this setting in Auction setup. Your other settings are kept.",
    action: "Edit auction setup",
  };
}
