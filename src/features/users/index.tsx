import { useCallback, useEffect, useMemo, useState } from "react";
import Drawer from "../../core/components/Drawer";
import { useRegisterDashboardFrame } from "../../core/useRegisterDashboardFrame";
import {
  userManagementApi,
  type AccountStatus,
  type AccountType,
  type ManagedUser,
  type IdentityVerificationStatus,
  type PartnerSubtype,
  type SecurityRole,
  type UserFilters,
  type UserStats,
} from "./userManagementApi";
import "./users.css";

const emptyStats: UserStats = { total: 0, admins: 0, approvedBidders: 0, pendingBidders: 0, suspended: 0 };
const initialFilters: Required<UserFilters> = { search: "", role: "all", accountType: "all", accountStatus: "all", bidderStatus: "all" };

function label(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function StatusBadge({ status, kind = "neutral" }: { status: string; kind?: "neutral" | "good" | "warn" | "danger" }) {
  return <span className={`usersBadge usersBadge--${kind}`}>{label(status)}</span>;
}

export default function UsersPage() {
  const frame = useMemo(
    () => ({
      title: "Users",
      subtitle: "Manage account types, access, and bidder eligibility",
    }),
    [],
  );

  useRegisterDashboardFrame(frame);

  const [filters, setFilters] = useState(initialFilters);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [stats, setStats] = useState(emptyStats);
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      userManagementApi.list(filters).then((result) => {
        setUsers(result.users);
        setStats(result.stats);
        setSelected((current) => current ? result.users.find((user) => user.accountId === current.accountId) ?? current : null);
      }).catch((err) => setError(err instanceof Error ? err.message : "Unable to load users")).finally(() => setLoading(false));
    }, filters.search ? 220 : 0);
    return () => window.clearTimeout(timer);
  }, [filters, reloadToken]);

  const refresh = useCallback(() => setReloadToken((value) => value + 1), []);
  const setFilter = (key: keyof typeof filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <div className="usersPage">
      <section className="usersStats" aria-label="User summary">
        <Stat label="Total accounts" value={stats.total} />
        <Stat label="Approved bidders" value={stats.approvedBidders} />
        <Stat label="Pending review" value={stats.pendingBidders} accent />
        <Stat label="Administrators" value={stats.admins} />
        <Stat label="Suspended" value={stats.suspended} />
      </section>

      <div className="usersToolbar">
        <label className="usersSearch"><span className="usersSrOnly">Search users</span><input value={filters.search} onChange={(event) => setFilter("search", event.target.value)} placeholder="Search name, email, company, or account ID" /></label>
        <div className="usersFilters">
          <Filter label="Role" value={filters.role} onChange={(value) => setFilter("role", value)} options={["all", "user", "admin"]} />
          <Filter label="Account type" value={filters.accountType} onChange={(value) => setFilter("accountType", value)} options={["all", "bidder", "partner"]} />
          <Filter label="Bid access" value={filters.bidderStatus} onChange={(value) => setFilter("bidderStatus", value)} options={["all", "none", "pending", "approved", "rejected", "suspended"]} />
          <Filter label="Status" value={filters.accountStatus} onChange={(value) => setFilter("accountStatus", value)} options={["all", "active", "suspended"]} />
          <button className="usersButton usersButton--quiet" type="button" onClick={refresh}>Refresh</button>
        </div>
      </div>

      {error ? <div className="usersNotice usersNotice--error">{error}</div> : null}
      <section className="usersTable" aria-busy={loading}>
        <div className="usersTable__row usersTable__row--header"><span>User</span><span>Account type</span><span>Bid access</span><span>Activity</span><span>Account</span></div>
        {loading && users.length === 0 ? <UserSkeleton /> : null}
        {!loading && users.length === 0 ? <div className="usersEmpty">No users match these filters.</div> : null}
        {users.map((user) => (
          <button key={user.accountId} className="usersTable__row usersTable__row--body" type="button" onClick={() => setSelected(user)}>
            <span className="usersIdentity"><span className="usersAvatar">{user.username.slice(0, 1).toUpperCase()}</span><span><strong>{user.username}</strong><small>{user.email || user.accountId}</small></span></span>
            <span><strong>{user.partnerSubtype ? `${label(user.accountType)} / ${label(user.partnerSubtype)}` : label(user.accountType)}</strong><small>{user.roles.map(label).join(", ")}</small></span>
            <span><StatusBadge status={user.bidderStatus === "none" ? "Not applied" : user.bidderStatus} kind={user.bidderStatus === "approved" ? "good" : user.bidderStatus === "pending" ? "warn" : user.bidderStatus === "rejected" || user.bidderStatus === "suspended" ? "danger" : "neutral"} /></span>
            <span><strong>{user.bidAuctionCount} auctions</strong><small>{user.bookmarkCount} saved</small></span>
            <span><StatusBadge status={user.accountStatus} kind={user.accountStatus === "active" ? "good" : "danger"} /></span>
          </button>
        ))}
      </section>
      <UserDrawer user={selected} onClose={() => setSelected(null)} onChanged={refresh} />
    </div>
  );
}

function Stat({ label: title, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return <div className={`usersStat${accent ? " usersStat--accent" : ""}`}><span>{title}</span><strong>{value}</strong></div>;
}

function Filter({ label: title, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const allLabel = title === "Role" ? "All roles" : title === "Account type" ? "All account types" : title === "Status" ? "All statuses" : "All bid access";
  return <label className="usersFilter"><span className="usersSrOnly">{title}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option === "all" ? allLabel : label(option)}</option>)}</select></label>;
}

function UserSkeleton() {
  return <>{[0, 1, 2, 3].map((row) => <div className="usersTable__row usersTable__row--skeleton" key={row}><i /><i /><i /><i /><i /></div>)}</>;
}

function UserDrawer({ user, onClose, onChanged }: { user: ManagedUser | null; onClose: () => void; onChanged: () => void }) {
  const [role, setRole] = useState<SecurityRole>("user");
  const [accountType, setAccountType] = useState<AccountType>("bidder");
  const [partnerSubtype, setPartnerSubtype] = useState<PartnerSubtype | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<IdentityVerificationStatus>("under_review");
  const [accountStatus, setAccountStatus] = useState<AccountStatus>("active");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setRole(user.userType); setAccountType(user.accountType); setPartnerSubtype(user.partnerSubtype); setAccountStatus(user.accountStatus); setVerificationStatus(user.latestApplication?.verification?.status ?? "under_review"); setNote(""); setError(null);
  }, [user]);

  const run = async (task: () => Promise<unknown>) => {
    setSaving(true); setError(null);
    try { await task(); onChanged(); } catch (err) { setError(err instanceof Error ? err.message : "Unable to save changes"); } finally { setSaving(false); }
  };

  if (!user) return null;
  const application = user.latestApplication;
  const canApprove = application?.status === "pending" || application?.status === "suspended";
  const canReject = application?.status === "pending" || application?.status === "approved";
  const canSuspendBidder = application?.status === "approved";

  return (
    <Drawer open onClose={onClose} size="lg" title="Manage user">
      <div className="userDrawer">
        <div className="userDrawer__identity"><span className="usersAvatar usersAvatar--large">{user.username.slice(0, 1).toUpperCase()}</span><div><h2>{user.username}</h2><p>{user.email || "No email on file"}</p></div></div>
        {error ? <div className="usersNotice usersNotice--error">{error}</div> : null}
        <section className="userDrawer__section">
          <div className="userDrawer__sectionHead"><div><h3>Account access</h3><p>Security role and customer account classification.</p></div><StatusBadge status={user.accountStatus} kind={user.accountStatus === "active" ? "good" : "danger"} /></div>
          <div className="userDrawer__fields">
            <label><span>Security role</span><select value={role} onChange={(event) => setRole(event.target.value as SecurityRole)}><option value="user">User</option><option value="admin">Administrator</option></select></label>
            <label><span>Account type</span><select value={accountType} onChange={(event) => setAccountType(event.target.value as AccountType)}><option value="bidder">Bidder</option><option value="partner">Partner</option></select></label>
            {accountType === "partner" ? <label><span>Partner subtype</span><select value={partnerSubtype ?? ""} onChange={(event) => setPartnerSubtype((event.target.value || null) as PartnerSubtype | null)}><option value="">General partner</option><option value="realtor">Realtor</option></select></label> : null}
            <label><span>Account status</span><select value={accountStatus} onChange={(event) => setAccountStatus(event.target.value as AccountStatus)}><option value="active">Active</option><option value="suspended">Suspended</option></select></label>
          </div>
          <button className="usersButton usersButton--solid" type="button" disabled={saving} onClick={() => run(() => userManagementApi.update(user.accountId, { userType: role, accountType, partnerSubtype: accountType === "partner" ? partnerSubtype : null, accountStatus }))}>Save account</button>
        </section>
        <section className="userDrawer__section">
          <div className="userDrawer__sectionHead"><div><h3>Bidder access</h3><p>Application review is separate from the account security role.</p></div><StatusBadge status={user.bidderStatus === "none" ? "Not applied" : user.bidderStatus} kind={user.bidderStatus === "approved" ? "good" : user.bidderStatus === "pending" ? "warn" : user.bidderStatus === "none" ? "neutral" : "danger"} /></div>
          {application ? <>
            {application.identity ? <div className="userDrawer__application"><div><span>Legal name</span><strong>{application.identity.legalName}</strong></div><div><span>Date of birth</span><strong>{application.identity.dateOfBirth}</strong></div><div><span>Bidder email</span><strong>{application.identity.email}</strong></div><div><span>Bidder phone</span><strong>{application.identity.phone}</strong></div><div><span>ID verification</span><strong>{label(application.verification?.status?.replace(/_/g, " ") || "under review")}</strong></div><div><span>Document</span><strong>{application.verification?.maskedDocument || "Not recorded"}</strong></div></div> : null}
            <div className="userDrawer__application">{Object.entries(application.payload).filter(([key]) => key !== "certified").map(([key, value]) => <div key={key}><span>{label(key.replace(/([A-Z])/g, " $1"))}</span><strong>{String(value || "Not provided")}</strong></div>)}</div>
            <label className="userDrawer__note"><span>Decision note</span><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Add context for the applicant and audit history" /></label>
            <div className="userDrawer__fields"><label><span>ID verification state</span><select value={verificationStatus} onChange={(event) => setVerificationStatus(event.target.value as IdentityVerificationStatus)}><option value="verifying">Verifying</option><option value="needs_attention">Needs attention</option><option value="under_review">Under review</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label></div>
            <div className="userDrawer__actions">
              <button className="usersButton usersButton--quiet" type="button" disabled={saving || verificationStatus === application.verification?.status} onClick={() => run(() => userManagementApi.updateVerification(user, verificationStatus, note))}>Update verification</button>
              {canApprove ? <button className="usersButton usersButton--solid" type="button" disabled={saving} onClick={() => run(() => userManagementApi.decide(user, "approve", note))}>{application.status === "suspended" ? "Reinstate bidder" : "Approve application"}</button> : null}
              {canReject ? <button className="usersButton usersButton--danger" type="button" disabled={saving} onClick={() => run(() => userManagementApi.decide(user, "reject", note))}>Reject access</button> : null}
              {canSuspendBidder ? <button className="usersButton usersButton--quiet" type="button" disabled={saving} onClick={() => run(() => userManagementApi.decide(user, "suspend", note))}>Suspend bidding</button> : null}
            </div>
          </> : <div className="usersEmpty usersEmpty--inline">This user has not submitted a bidder application.</div>}
        </section>
        <section className="userDrawer__section userDrawer__metadata"><div><span>Account ID</span><strong>{user.accountId}</strong></div><div><span>Created</span><strong>{formatDate(user.createdAt)}</strong></div><div><span>Last updated</span><strong>{formatDate(user.updatedAt)}</strong></div>{user.company ? <div><span>Company</span><strong>{user.company}</strong></div> : null}{user.licenseNumber ? <div><span>License</span><strong>{user.licenseNumber}</strong></div> : null}</section>
      </div>
    </Drawer>
  );
}
