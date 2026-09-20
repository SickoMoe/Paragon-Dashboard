export const relationships = ['property_owner', 'co_owner', 'authorized_representative', 'executor', 'agent_broker', 'entity_representative', 'other'];
export const categories = ['proof_authority', 'title', 'survey', 'seller_disclosure', 'inspection', 'hoa', 'appraisal', 'tax', 'legal', 'auction', 'other'];
export const label = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
export type Authority = { relationship: string; legalName: string; representativeName: string; contact: string; brokerage: string; notes: string; status: string; reviewNote?: string };
export type Document = { documentId: string; filename: string; category: string; visibility: string; status: string; uploadedAt: string; note: string; reviewNote?: string; canRemove: boolean };
export type Liquidation = { listingId: string; revision: number; authority: Authority; documents: Document[]; requiredDocuments: string[]; requirementsNote: string; canReview: boolean; listingReviewStatus: string; auctionStatus: string; readiness: { ready: boolean; documentsReady: boolean; checks: { code: string; label: string; satisfied: boolean }[]; blockers: { code: string; label: string }[] } };
