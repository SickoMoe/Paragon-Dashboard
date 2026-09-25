import type { PropertyLocation } from "../../components/propertyLocation/location";
import type { IListing } from "../../interfaces/IListing";
export const assetStatuses = ["active", "inactive", "sold", "archived"];
export const opportunityStatuses = [
  "idea",
  "evaluating",
  "feasible",
  "structuring",
  "active",
  "on_hold",
  "completed",
  "rejected",
  "archived",
];
export const opportunityTypes = [
  "liquidation",
  "acquisition",
  "development",
  "repositioning",
  "disposition",
  "other",
];
export const label = (value: string) =>
  value.replace(/_/g, " ").replace(/^./, (s) => s.toUpperCase());
export const money = (value: number | null) =>
  value == null
    ? "Not set"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
export const when = (value: string) => new Date(value).toLocaleString();
export type Person = { accountId: string; name: string; userType: string };
export type Activity = {
  eventId: string;
  at: string;
  actorAccountId: string | null;
  type: string;
  details: Record<string, unknown>;
  link?: { kind: string; id: string };
};
export type Asset = {
  assetId: string;
  title: string;
  assetType: string;
  location: PropertyLocation;
  parcel: string;
  description: string;
  primaryImage: string;
  media: IListing["media"];
  characteristics: IListing["propertyFeatures"];
  relationships: { accountId: string; role: string; state: string }[];
  status: string;
  notes: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  activity: Activity[];
  opportunities: Opportunity[];
  duplicateCount?: number;
  duplicates?: Asset[];
  people?: Person[];
};
export type Summary = {
  phase: string;
  nextAction: string;
  listing: {
    listingId: string;
    title: string;
    status: string;
    moderationStatus: string;
    approvedReviewRequestId?: string;
    location: PropertyLocation;
  } | null;
  auctionDrafts: { id: string; status: string }[];
  auctions: {
    auctionId: string;
    status: string;
    result: { outcome: string; winningAmount: number | null; invalidated: boolean } | null;
  }[];
  transactions: {
    transactionId: string;
    status: string;
    winningAmount: number;
    currency: string;
    property: { title: string; address: string };
    completedAt: string | null;
  }[];
};
export type Opportunity = {
  opportunityId: string;
  assetId: string;
  type: string;
  status: string;
  title: string;
  description: string;
  source: string;
  priority: string;
  assignedAccountId: string | null;
  estimatedValue: number | null;
  targetValue: number | null;
  currency: string;
  notes: string;
  askingPrice: number | null;
  targetAcquisitionPrice: number | null;
  contactReference: string;
  dueDiligenceSummary: string;
  strategyNotes: string;
  concept: string;
  budgetAssumption: number | null;
  listingId: string | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  activity: Activity[];
  summary: Summary;
  asset?: Asset;
  operator?: string;
  people?: Person[];
  readiness?: { checks: { code: string; label: string; satisfied: boolean }[] };
};
export const closed = (status: string) => ["completed", "rejected", "archived"].includes(status);
