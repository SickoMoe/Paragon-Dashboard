// src/routes/dashboard/controllers/useAuctionDrawerController.ts
import { useEffect, useMemo, useState } from "react";
import type { IAuction } from "../../../interfaces/IAuction";
import type { IListing } from "../../../interfaces/IListing";

import {
  updateAuctionSchedule,
  submitAuction,
  withdrawAuction,
  approveAuction,
  requestAuctionChanges,
  rejectAuction,
  publishAuction,
  pauseAuction,
  resumeAuction,
  endAuction,
  cancelAuction,
  archiveAuction,
  relistAuction,
  deleteAuction,
  patchAuction,
  patchAuctionDraft,
  fetchAuctionDraftReadiness,
  type AuctionPatch,
  type AuctionDraftRecord,
  type AuctionDraftReadiness,
} from "../services/auctionDashboardApi";
import { AuctionLeaderboardDTO, fetchAuctionBids } from "../services/auctionBidApi";
import {
  ListingPatch,
  approveListingDraft,
  patchListing,
  rejectListingDraft,
  requestListingDraftChanges,
  updateListingReviewRequest,
  updateListingStatus,
  type ListingDraftReviewResult,
  type ListingModerationStatus,
  type ListingReviewFieldIssue,
  type ListingReviewRequest,
} from "../../listingApi";
import { AuctionOverview } from "../types";
import { getListingThumbnailPath } from "../utils/listingMedia";

function normalizeAccountIds(value: string | string[] | undefined) {
  const ids = Array.isArray(value) ? value : String(value ?? "").split(/[\n,]/);
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
}

export function useAuctionDrawerController(
  row: AuctionOverview,
  onUpdate: (updated: AuctionOverview) => void,
  onDelete?: (id: string) => void,
  onClose?: () => void,
) {
  const [auctionLoading, setAuctionLoading] = useState(false);
  const [listingSaving, setListingSaving] = useState(false);
  const loading = auctionLoading || listingSaving;
  const [saveSucceeded, setSaveSucceeded] = useState(false);
  const [auctionError, setAuctionError] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<AuctionDraftReadiness | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [readinessError, setReadinessError] = useState<string | null>(null);

  const auction = row.auction;

  const [editingSchedule, setEditingSchedule] = useState(false);
  const [startDate, setStartDate] = useState<string>(auction.startDate ? toLocalInput(auction.startDate) : "");
  const [endDate, setEndDate] = useState<string>(auction.endDate ? toLocalInput(auction.endDate) : "");

  const startLabel = useMemo(
    () => (auction.startDate ? new Date(auction.startDate).toLocaleString() : "—"),
    [auction.startDate],
  );
  const endLabel = useMemo(
    () => (auction.endDate ? new Date(auction.endDate).toLocaleString() : "—"),
    [auction.endDate],
  );
  const [editingDetails, setEditingDetails] = useState(false);
  const [listingId, setListingId] = useState<string>(auction.listingId ?? "");
  const [startingBid, setStartingBid] = useState<string>(
    auction.startingBid != null ? String(auction.startingBid) : "",
  );
  const [increment, setIncrement] = useState<string>(
    auction.rules?.bidIncrement != null ? String(auction.rules.bidIncrement) : "",
  );
  const [status, setStatus] = useState<IAuction["status"]>(auction.status);
  const [isPrivate, setIsPrivate] = useState<boolean>(Boolean(auction.isPrivate));
  const [authorizedAccountIds, setAuthorizedAccountIds] = useState<string>(
    (auction.authorizedAccountIds ?? []).join("\n"),
  );

  const [listing, setListing] = useState<IListing | null>(row.listing ?? null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [moderationStatus, setModerationStatus] = useState<ListingModerationStatus>(
    normalizeModerationStatus(row.listing?.moderationStatus ?? row.listing?.tags?.status),
  );

  function syncListingFields(nextListing?: IListing | null) {
    const bi = nextListing?.basicInformation;
    const loc = bi?.location;

    setTitle(bi?.title ?? "");
    setType(bi?.type ?? "");
    setAddress(loc?.address ?? "");
    setCity(loc?.city ?? "");
    setState(loc?.state ?? "");
    setZipcode(loc?.zipcode ?? "");
    setThumbnailUrl(getListingThumbnailPath(nextListing));
    setModerationStatus(normalizeModerationStatus(nextListing?.moderationStatus ?? nextListing?.tags?.status));
  }

  useEffect(() => {
    setEditingSchedule(false);
    setAuctionError(null);
    setEditingDetails(false);
    setStartDate(auction.startDate ? toLocalInput(auction.startDate) : "");
    setEndDate(auction.endDate ? toLocalInput(auction.endDate) : "");

    setListingId(auction.listingId ?? "");
    setStartingBid(auction.startingBid != null ? String(auction.startingBid) : "");
    setIncrement(auction.rules?.bidIncrement != null ? String(auction.rules.bidIncrement) : "");
    setStatus(auction.status);
    setIsPrivate(Boolean(auction.isPrivate));
    setAuthorizedAccountIds((auction.authorizedAccountIds ?? []).join("\n"));

    setListing(row.listing ?? null);
    syncListingFields(row.listing);
  }, [auction.id]); // ok

  const listingLoading = false;
  const currentListing = listing ?? row.listing ?? null;
  const [bidsOpen, setBidsOpen] = useState(false);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [bidsError, setBidsError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<AuctionLeaderboardDTO | null>(null);

  const hasUnsavedChanges = useMemo(() => {
    const scheduleChanged =
      (auction.startDate ? toLocalInput(auction.startDate) : "") !== startDate ||
      (auction.endDate ? toLocalInput(auction.endDate) : "") !== endDate;

    const nextListingId = listingId.trim();
    const bidRaw = startingBid.trim();
    const incRaw = increment.trim();

    const bidChanged =
      bidRaw !== "" && Number.isFinite(Number(bidRaw)) && Number(bidRaw) !== Number(auction.startingBid ?? 0);

    const incChanged =
      incRaw !== "" && Number.isFinite(Number(incRaw)) && Number(incRaw) !== Number(auction.rules?.bidIncrement ?? 0);

    const listingIdChanged = nextListingId !== (auction.listingId ?? "");
    const privacyChanged = isPrivate !== Boolean(auction.isPrivate);
    const authorizationChanged =
      normalizeAccountIds(authorizedAccountIds).join("|") !==
      normalizeAccountIds(auction.authorizedAccountIds).join("|");
    return scheduleChanged || bidChanged || incChanged || listingIdChanged || privacyChanged || authorizationChanged;
  }, [
    auction.startDate,
    auction.endDate,
    auction.startingBid,
    auction.rules?.bidIncrement,
    auction.listingId,
    auction.isPrivate,
    auction.authorizedAccountIds,
    startDate,
    endDate,
    listingId,
    startingBid,
    increment,
    isPrivate,
    authorizedAccountIds,
  ]);

  useEffect(() => {
    const draftId = row.auctionDraft?.id;
    if (!draftId) {
      setReadiness(null);
      setReadinessError(null);
      setReadinessLoading(false);
      return;
    }

    let cancelled = false;
    let sequence = 0;
    setReadinessLoading(true);
    setReadinessError(null);
    const refresh = async () => {
      const current = ++sequence;
      try {
        const next = await fetchAuctionDraftReadiness(draftId);
        if (!cancelled && current === sequence) { setReadiness(next); setReadinessError(null); }
      } catch (err) {
        if (!cancelled && current === sequence) setReadinessError(getErrorMessage(err, "Failed to load draft readiness"));
      } finally {
        if (!cancelled && current === sequence) setReadinessLoading(false);
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [row.auctionDraft?.id, row.auctionDraft?.updatedAt]);

  function handleCancelEdit() {
    if (!hasUnsavedChanges) {
      onClose?.();
      return;
    }

    const shouldDiscard = window.confirm("Discard unsaved changes?");
    if (!shouldDiscard) return;

    onClose?.();
  }

  async function handleOpenBids() {
    setBidsOpen(true);

    // already loaded once? don’t re-fetch unless you want a refresh button
    if (leaderboard) return;

    setBidsLoading(true);
    setBidsError(null);
    try {
      const data = await fetchAuctionBids(auction.id);
      setLeaderboard(data);
    } catch (e: any) {
      setBidsError(e?.message ?? "Failed to load bids");
    } finally {
      setBidsLoading(false);
    }
  }

  function handleCloseBids() {
    setBidsOpen(false);
  }
  function mergeRow(nextAuction: IAuction): AuctionOverview {
    return {
      ...row,
      auction: nextAuction,
      listing: row.listing,
      bid: row.bid,
    };
  }

  function mergeAuctionDraftRow(nextDraft: AuctionDraftRecord): AuctionOverview {
    const nextAuction: IAuction = {
      ...auction,
      listingId: nextDraft.payload.listingId,
      startDate: nextDraft.payload.startDate,
      endDate: nextDraft.payload.endDate,
      startingBid: nextDraft.payload.startingBid ?? 0,
      isPrivate: nextDraft.payload.isPrivate ?? false,
      status: "draft",
      updatedAt: nextDraft.updatedAt,
      rules: {
        ...auction.rules,
        bidIncrement: nextDraft.payload.rules?.bidIncrement ?? auction.rules?.bidIncrement ?? 0,
      },
    };

    return {
      ...row,
      auction: nextAuction,
      auctionDraft: nextDraft,
      bid: {
        ...row.bid,
        openingBid: nextAuction.startingBid ?? 0,
        currentBid: nextAuction.startingBid ?? 0,
        incrementAmount: nextAuction.rules?.bidIncrement ?? 0,
      },
    };
  }

  function buildAuctionDraftPayload() {
    const base = row.auctionDraft?.payload ?? { listingId: auction.listingId };
    const bidRaw = startingBid.trim();
    const incRaw = increment.trim();

    return {
      ...base,
      listingId: listingId.trim() || base.listingId || auction.listingId,
      startingBid:
        bidRaw !== "" && Number.isFinite(Number(bidRaw))
          ? Number(bidRaw)
          : base.startingBid,
      rules: {
        ...(base.rules ?? {}),
        bidIncrement:
          incRaw !== "" && Number.isFinite(Number(incRaw))
            ? Number(incRaw)
            : base.rules?.bidIncrement,
      },
      startDate: startDate ? new Date(startDate).toISOString() : base.startDate,
      endDate: endDate ? new Date(endDate).toISOString() : base.endDate,
      isPrivate,
      authorizedAccountIds: isPrivate ? normalizeAccountIds(authorizedAccountIds) : [],
      status: "draft" as const,
    };
  }

  async function handleSaveAuctionDraftAll() {
    if (!row.auctionDraft) return;
    setAuctionLoading(true);
    setAuctionError(null);
    setSaveSucceeded(false);
    try {
      const updatedDraft = await patchAuctionDraft(row.auctionDraft.id, buildAuctionDraftPayload());
      const nextReadiness = await fetchAuctionDraftReadiness(updatedDraft.id);
      setReadiness(nextReadiness);
      onUpdate(mergeAuctionDraftRow(updatedDraft));
      setSaveSucceeded(true);
    } catch (err: any) {
      setAuctionError(getErrorMessage(err, "Failed to save auction draft"));
    } finally {
      setAuctionLoading(false);
    }
  }

  async function runAuctionAction(
    action: () => Promise<IAuction>,
    fallback: string,
  ) {
    setAuctionLoading(true);
    setAuctionError(null);
    try {
      const nextAuction = await action();
      onUpdate(mergeRow(nextAuction));
    } catch (err: any) {
      setAuctionError(getErrorMessage(err, fallback));
    } finally {
      setAuctionLoading(false);
    }
  }

  async function handleSubmit() {
    await runAuctionAction(() => submitAuction(auction.id), "Failed to submit auction");
  }

  async function handleWithdraw() {
    await runAuctionAction(() => withdrawAuction(auction.id), "Failed to withdraw auction");
  }

  async function handleApprove() {
    await runAuctionAction(() => approveAuction(auction.id), "Failed to approve auction");
  }

  async function handleRequestChanges() {
    const reason = promptReason("Change request");
    if (!reason) return;
    await runAuctionAction(() => requestAuctionChanges(auction.id, reason), "Failed to request changes");
  }

  async function handleReject() {
    const reason = promptReason("Rejection");
    if (!reason) return;
    await runAuctionAction(() => rejectAuction(auction.id, reason), "Failed to reject auction");
  }

  async function handlePublish() {
    await runAuctionAction(() => publishAuction(auction.id), "Failed to publish auction");
  }

  async function handlePause() {
    const reason = promptReason("Pause");
    if (!reason) return;
    await runAuctionAction(() => pauseAuction(auction.id, reason), "Failed to pause auction");
  }

  async function handleResume() {
    await runAuctionAction(() => resumeAuction(auction.id), "Failed to resume auction");
  }

  async function handleEnd() {
    await runAuctionAction(() => endAuction(auction.id), "Failed to end auction");
  }

  async function handleCancelAuction() {
    const reason = promptReason("Cancellation");
    if (!reason) return;
    await runAuctionAction(() => cancelAuction(auction.id, reason), "Failed to cancel auction");
  }

  async function handleArchive() {
    await runAuctionAction(() => archiveAuction(auction.id), "Failed to archive auction");
  }

  async function handleRelist() {
    setAuctionLoading(true);
    setAuctionError(null);
    try {
      const nextRow = await relistAuction(auction.id);
      onUpdate(nextRow);
    } catch (err: any) {
      setAuctionError(getErrorMessage(err, "Failed to relist auction"));
    } finally {
      setAuctionLoading(false);
    }
  }

  async function handleScheduleSave() {
    if (row.auctionDraft) {
      await handleSaveAuctionDraftAll();
      return;
    }

    if (!startDate || !endDate) return;

    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    if (!Number.isFinite(s) || !Number.isFinite(e) || s >= e) return;

    setAuctionLoading(true);
    try {
      const nextAuction = await updateAuctionSchedule(
        auction.id,
        new Date(startDate).toISOString(),
        new Date(endDate).toISOString(),
      );
      onUpdate(mergeRow(nextAuction));
      setEditingSchedule(false);
    } finally {
      setAuctionLoading(false);
    }
  }

  async function handleSaveDetails() {
    if (row.auctionDraft) {
      await handleSaveAuctionDraftAll();
      return;
    }

    const patch: AuctionPatch = {};

    const nextListingId = listingId.trim();
    if (nextListingId && nextListingId !== auction.listingId) {
      patch.id = auction.id; // optional (remove if server rejects)
      (patch as any).listingId = nextListingId; // only if your IAuction supports listingId updates
    }

    const bidRaw = startingBid.trim();
    if (bidRaw !== "") {
      const n = Number(bidRaw);
      if (Number.isFinite(n) && n >= 0 && n !== Number(auction.startingBid ?? 0)) {
        patch.startingBid = n;
      }
    }

    const incRaw = increment.trim();
    const currentInc = Number(auction.rules?.bidIncrement ?? 0);
    if (incRaw !== "") {
      const n = Number(incRaw);
      if (Number.isFinite(n) && n >= 0 && n !== currentInc) {
        patch.rules = { bidIncrement: n };
      }
    }

    if (isPrivate !== Boolean(auction.isPrivate)) {
      patch.isPrivate = isPrivate;
    }
    const nextAuthorizedAccountIds = isPrivate ? normalizeAccountIds(authorizedAccountIds) : [];
    if (
      nextAuthorizedAccountIds.join("|") !==
      normalizeAccountIds(auction.authorizedAccountIds).join("|")
    ) {
      patch.authorizedAccountIds = nextAuthorizedAccountIds;
    }

    if (Object.keys(patch).length === 0) {
      setEditingDetails(false);
      return;
    }

    setAuctionLoading(true);
    try {
      const nextAuction = await patchAuction(auction.id, patch);
      onUpdate(mergeRow(nextAuction));
      setEditingDetails(false);
    } finally {
      setAuctionLoading(false);
    }
  }

  async function handleDeleteClick() {
    setAuctionLoading(true);
    setAuctionError(null);
    try {
      const result = await deleteAuction(auction.id);
      if (result?.mode === "archived" && result.auction) {
        onUpdate(mergeRow(result.auction));
        return;
      }
      onDelete?.(auction.id);
      onClose?.();
    } catch (err: any) {
      setAuctionError(getErrorMessage(err, "Failed to delete auction"));
    } finally {
      setAuctionLoading(false);
    }
  }
  async function handleSaveAll() {
    if (row.auctionDraft) {
      await handleSaveAuctionDraftAll();
      return;
    }

    setSaveSucceeded(false);
    // Save schedule if valid + changed
    const scheduleChanged =
      (auction.startDate ? toLocalInput(auction.startDate) : "") !== startDate ||
      (auction.endDate ? toLocalInput(auction.endDate) : "") !== endDate;

    // Save auction details if changed
    const nextListingId = listingId.trim();
    const bidRaw = startingBid.trim();
    const incRaw = increment.trim();

    const bidChanged =
      bidRaw !== "" && Number.isFinite(Number(bidRaw)) && Number(bidRaw) !== Number(auction.startingBid ?? 0);

    const incChanged =
      incRaw !== "" && Number.isFinite(Number(incRaw)) && Number(incRaw) !== Number(auction.rules?.bidIncrement ?? 0);

    const listingIdChanged = nextListingId !== (auction.listingId ?? "");
    const privacyChanged = isPrivate !== Boolean(auction.isPrivate);
    const authorizationChanged =
      normalizeAccountIds(authorizedAccountIds).join("|") !==
      normalizeAccountIds(auction.authorizedAccountIds).join("|");
    // 1) schedule
    if (scheduleChanged) {
      await handleScheduleSave();
    }

    // 2) auction details
    if (listingIdChanged || bidChanged || incChanged || privacyChanged || authorizationChanged) {
      await handleSaveDetails();
    }

    setSaveSucceeded(true);
  }
  async function handleListingModeration(nextStatus: ListingModerationStatus) {
    if (!currentListing) return;

    setListingSaving(true);
    setAuctionError(null);
    setSaveSucceeded(false);
    try {
      const updatedListing = await updateListingStatus(currentListing, nextStatus);
      setModerationStatus(nextStatus);
      setListing(updatedListing);

      onUpdate({
        ...row,
        auction,
        listing: updatedListing,
        listingReview: row.listingReview
          ? {
              ...row.listingReview,
              status: nextStatus,
              request: row.listingReview.request
                ? { ...row.listingReview.request, updatedAt: new Date().toISOString() }
                : row.listingReview.request,
            }
          : row.listingReview,
      });
      setSaveSucceeded(true);
    } catch (err) {
      const message = getErrorMessage(err, "Failed to update listing review status");
      setAuctionError(message);
      throw new Error(message);
    } finally {
      setListingSaving(false);
    }
  }


  function applyDraftReviewUpdate(
    nextStatus: string,
    request?: ListingReviewRequest,
    nextListing?: IListing | null,
  ) {
    const updatedListing = nextListing ?? currentListing;
    if (nextListing) {
      setListing(nextListing);
      syncListingFields(nextListing);
    }

    onUpdate({
      ...row,
      auction,
      listing: updatedListing ?? row.listing,
      listingReview: row.listingReview
        ? {
            ...row.listingReview,
            status: nextStatus,
            request: row.listingReview.request
              ? {
                  ...row.listingReview.request,
                  status: request?.status ?? nextStatus,
                  revision: request?.revision ?? row.listingReview.request.revision,
                  updatedAt: request?.updatedAt ?? new Date().toISOString(),
                  reviewedAt: request?.reviewedAt,
                  reviewedBy: request?.reviewedBy,
                  reviewReason: request?.generalMessage,
                  generalMessage: request?.generalMessage,
                  fieldIssues: request?.fieldIssues,
                  data: request?.submittedSnapshot ?? row.listingReview.request.data,
                  submittedSnapshot: request?.submittedSnapshot ?? row.listingReview.request.submittedSnapshot,
                  adminEditedSnapshot: request?.adminEditedSnapshot,
                  approvedSnapshot: request?.approvedSnapshot,
                }
              : row.listingReview.request,
            history: request
              ? [
                  request as any,
                  ...(row.listingReview.history ?? []).filter(
                    (item: any) => item.reviewRequestId !== request.reviewRequestId,
                  ),
                ]
              : row.listingReview.history,
          }
        : row.listingReview,
    });
  }

  async function runListingDraftAction(
    action: () => Promise<ListingReviewRequest | ListingDraftReviewResult>,
    fallback: string,
    nextStatus: string,
  ) {
    setListingSaving(true);
    setAuctionError(null);
    setSaveSucceeded(false);
    try {
      const result = await action();
      const request = "request" in result ? result.request : result;
      const nextListing = "listing" in result ? result.listing : undefined;
      applyDraftReviewUpdate(nextStatus, request, nextListing);
      setSaveSucceeded(true);
    } catch (err) {
      const message = getErrorMessage(err, fallback);
      setAuctionError(message);
      throw new Error(message);
    } finally {
      setListingSaving(false);
    }
  }

  async function handleApproveListingDraft() {
    const reviewRequestId = row.listingReview?.request?.reviewRequestId ?? row.listingReview?.request?.draftId;
    if (!reviewRequestId) return;
    await runListingDraftAction(
      () => approveListingDraft(reviewRequestId, row.listingReview?.request?.revision),
      "Failed to approve listing draft",
      "approved",
    );
  }

  async function handleRequestListingDraftChanges() {
    const reviewRequestId = row.listingReview?.request?.reviewRequestId ?? row.listingReview?.request?.draftId;
    if (!reviewRequestId) return;
    const reason = promptReason("Listing change request");
    if (!reason) return;
    await runListingDraftAction(
      () => requestListingDraftChanges(reviewRequestId, reason, row.listingReview?.request?.revision),
      "Failed to request listing changes",
      "changes_requested",
    );
  }

  async function handleRejectListingDraft() {
    const reviewRequestId = row.listingReview?.request?.reviewRequestId ?? row.listingReview?.request?.draftId;
    if (!reviewRequestId) return;
    const reason = promptReason("Listing rejection");
    if (!reason) return;
    await runListingDraftAction(
      () => rejectListingDraft(reviewRequestId, reason, row.listingReview?.request?.revision),
      "Failed to reject listing draft",
      "rejected",
    );
  }

  async function handleSaveListingReviewEdit(input: {
    adminEditedSnapshot?: any;
    generalMessage?: string;
    fieldIssues?: ListingReviewFieldIssue[];
  }) {
    const reviewRequestId = row.listingReview?.request?.reviewRequestId ?? row.listingReview?.request?.draftId;
    if (!reviewRequestId) return;
    await runListingDraftAction(
      () =>
        updateListingReviewRequest(reviewRequestId, {
          expectedRevision: row.listingReview?.request?.revision,
          ...input,
        }),
      "Failed to save review edits",
      row.listingReview?.request?.status ?? "pending",
    );
  }

  async function handleSaveListing() {
    if (!currentListing) return;

    const patch: ListingPatch = {
      basicInformation: {
        title,
        type,
        location: { address, city, state, zipcode },
      },
      media: {
        ...(currentListing.media ?? { images: [] }),
        thumbnailUrl: thumbnailUrl.trim(),
      },
      moderationStatus,
      tags: {
        ...(currentListing.tags ?? {}),
        status: moderationStatus,
      },
    };

    setListingSaving(true);
    try {
      const updatedListing = await patchListing(currentListing.listingId, patch);
      setListing(updatedListing);

      onUpdate({
        ...row,
        auction,
        listing: updatedListing,
      });
    } finally {
      setListingSaving(false);
    }
  }
  function handleExternalListingUpdate(updatedListing: IListing) {
    setListing(updatedListing);
    syncListingFields(updatedListing);
    onUpdate({
      ...row,
      auction,
      listing: updatedListing,
    });
  }

  return {
    row: {
      ...row,
      listing: currentListing,
    },
    // schedule
    editingSchedule,
    setEditingSchedule,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    startLabel,
    endLabel,
    handleScheduleSave,
    handleSaveAll,
    // listing
    listingLoading,
    title,
    setTitle,
    type,
    setType,
    address,
    setAddress,
    city,
    setCity,
    state,
    setState,
    zipcode,
    setZipcode,
    thumbnailUrl,
    setThumbnailUrl,
    moderationStatus,
    setModerationStatus,
    handleSaveListing,
    handleExternalListingUpdate,
    handleListingModeration,
    handleApproveListingDraft,
    handleRequestListingDraftChanges,
    handleRejectListingDraft,
    handleSaveListingReviewEdit,

    // details
    editingDetails,
    setEditingDetails,
    listingId,
    setListingId,
    startingBid,
    setStartingBid,
    increment,
    setIncrement,
    auctionError,
    status,
    setStatus,
    isPrivate,
    setIsPrivate,
    authorizedAccountIds,
    setAuthorizedAccountIds,
    readiness,
    readinessLoading,
    readinessError,

    // actions
    loading,
    saveSucceeded,
    hasUnsavedChanges,
    handleCancelEdit,
    handleSaveDetails,
    handleSubmit,
    handleWithdraw,
    handleApprove,
    handleRequestChanges,
    handleReject,
    handlePublish,
    handlePause,
    handleResume,
    handleEnd,
    handleCancelAuction,
    handleArchive,
    handleRelist,
    handleDeleteClick,

    // bids panel props too
    bidsOpen,
    bidsLoading,
    bidsError,
    leaderboard,
    handleOpenBids,
    handleCloseBids,
  };
}

function promptReason(label: string) {
  return window.prompt(`${label} reason`)?.trim() ?? "";
}

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}
function normalizeModerationStatus(status?: string): ListingModerationStatus {
  if (status === "pending" || status === "approved" || status === "denied" || status === "removed") {
    return status;
  }
  return "pending";
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
