import { request } from "../../core/api/request";

export type SecurityRole = "user" | "admin";
export type AccountType = "bidder" | "partner";
export type PartnerSubtype = "realtor";
export type IdentityVerificationStatus = "verifying" | "needs_attention" | "under_review" | "approved" | "rejected";
export type AccountStatus = "active" | "suspended";
export type BidderStatus = "none" | "pending" | "approved" | "rejected" | "suspended";

export type BidderApplication = {
  applicationId: string;
  accountId: string;
  status: Exclude<BidderStatus, "none">;
  payload: Record<string, unknown>;
  identity?: {
    legalName: string;
    dateOfBirth: string;
    email: string;
    phone: string;
    residentialAddress: Record<string, string | undefined>;
  };
  verification?: {
    status: IdentityVerificationStatus;
    method: "third_party" | "admin_review";
    maskedDocument?: string;
    verifiedAt?: string;
    note?: string;
  };
  createdAt: string;
  updatedAt: string;
  decidedAt?: string;
  decidedByAccountId?: string;
  decisionNote?: string;
};

export type ManagedUser = {
  accountId: string;
  username: string;
  email: string | null;
  phone: string | null;
  userType: SecurityRole;
  accountType: AccountType;
  partnerSubtype: PartnerSubtype | null;
  roles: Array<"bidder" | "partner" | "service_provider">;
  accountStatus: AccountStatus;
  bidderStatus: BidderStatus;
  biddingEligibility: boolean;
  bidderApplicationId: string | null;
  bidderIdentity: {
    legalName?: string;
    verificationStatus: IdentityVerificationStatus;
    verifiedAt?: string;
    maskedDocument?: string;
  } | null;
  company: string | null;
  licenseNumber: string | null;
  bookmarkCount: number;
  bidAuctionCount: number;
  createdAt: string;
  updatedAt: string;
  latestApplication: BidderApplication | null;
};

export type UserStats = {
  total: number;
  admins: number;
  approvedBidders: number;
  pendingBidders: number;
  suspended: number;
};

export type UserFilters = {
  search?: string;
  role?: string;
  accountType?: string;
  accountStatus?: string;
  bidderStatus?: string;
};

function queryString(filters: UserFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") params.set(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const userManagementApi = {
  list(filters: UserFilters = {}) {
    return request<{ users: ManagedUser[]; stats: UserStats }>(
      `/api/admin/users${queryString(filters)}`,
    );
  },
  update(
    accountId: string,
    patch: Partial<Pick<ManagedUser, "userType" | "accountType" | "partnerSubtype" | "accountStatus">>,
  ) {
    return request<{ user: ManagedUser }>(`/api/admin/users/${accountId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },
  decide(
    user: ManagedUser,
    action: "approve" | "reject" | "suspend",
    note?: string,
  ) {
    const applicationId = user.latestApplication?.applicationId;
    if (!applicationId) throw new Error("No bidder application is available");
    return request<{ ok: true }>(
      `/api/bidder/${user.accountId}/applications/${applicationId}/${action}`,
      { method: "POST", body: JSON.stringify({ note }) },
    );
  },
  updateVerification(user: ManagedUser, status: IdentityVerificationStatus, note?: string) {
    const applicationId = user.latestApplication?.applicationId;
    if (!applicationId) throw new Error("No bidder application is available");
    return request(
      `/api/bidder/${user.accountId}/applications/${applicationId}/verification`,
      { method: "PATCH", body: JSON.stringify({ status, note }) },
    );
  },
};
