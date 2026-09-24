export type TransactionDocument = {
  documentId: string;
  filename: string;
  category: string;
  visibility: "participants" | "internal";
  contentType: string;
  size: number;
  uploadedAt: string;
};
export type Transaction = {
  transactionId: string;
  auctionId: string;
  listingId: string;
  winningBidId: string;
  winningAmount: number;
  currency: string;
  revision: number;
  role: "buyer" | "seller" | "admin";
  status: string;
  agreementStatus: string;
  agreementDueAt: string | null;
  agreementReadyAt: string | null;
  agreementSentAt: string | null;
  agreementSignedAt: string | null;
  depositStatus: string;
  depositAmount: number | null;
  depositDueAt: string | null;
  depositReceivedAt: string | null;
  closingStatus: string;
  closingDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  failedAt: string | null;
  terminationReason: string | null;
  locked: boolean;
  nextAction: string;
  property: {
    title: string;
    address: string;
    city: string;
    state: string;
    zipcode: string;
    image: string | null;
  };
  origin: {
    finalizedAt: string;
    reserveMet: boolean;
    reservePrice: number | null;
    winningBidId: string;
    winningAmount: number;
    buyerAccountId?: string;
    sellerAccountId?: string;
  };
  buyer?: { name: string; accountId: string; email: string };
  seller?: { name: string; accountId: string; email: string };
  resultCorrections?: { at: string; reason: string }[];
  notes: { noteId: string; at: string; text: string; visibility: string; actor: string }[];
  documents: TransactionDocument[];
  timeline: {
    eventId: string;
    at: string;
    actor: string;
    type: string;
    visibility: string;
    details: Record<string, unknown>;
  }[];
};
export const label = (value: string) =>
  (
    ({
      pending_agreement: "Preparing agreement",
      agreement_in_progress: "Agreement in progress",
      deposit_due: "Deposit due",
      deposit_received: "Deposit confirmed",
      closing_in_progress: "Closing in progress",
      not_ready: "Being prepared",
      not_due: "Not yet due",
      not_started: "Not started",
      in_progress: "In progress",
      ready: "Ready to review",
      sent: "Sent for signature",
      signed: "Signed",
      void: "Voided",
      received: "Received",
      waived: "Waived",
      scheduled: "Scheduled",
      completed: "Completed",
      cancelled: "Cancelled",
      failed: "Failed",
    }) as Record<string, string>
  )[value] || value.replace(/[._]/g, " ").replace(/^./, (s) => s.toUpperCase());
export const money = (amount: number | null, currency: string) =>
  amount == null
    ? "Not set"
    : new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
export const when = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "Not set";
