// src/routes/dashboard/controllers/useAuctionDrawerController.ts
import { useEffect, useMemo, useState } from "react";
import type { IAuction } from "../../../interfaces/IAuction";
import type { IListing } from "../../../interfaces/IListing";

import {
  updateAuctionSchedule,
  publishAuction,
  endAuction,
  deleteAuction,
  patchAuction,
  type AuctionPatch,
} from "../services/auctionDashboardApi";
import { AuctionLeaderboardDTO, fetchAuctionBids } from "../services/auctionBidApi";
import { ListingPatch, patchListing, type ListingModerationStatus } from "../../listingApi";
import { AuctionOverview } from "../types";
type DrawerMode = "overview" | "edit";
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

  const [listing, setListing] = useState<IListing | null>(row.listing ?? null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [primaryImage, setPrimaryImage] = useState("");
  const [moderationStatus, setModerationStatus] = useState<ListingModerationStatus>(
    normalizeModerationStatus(row.listing?.moderationStatus ?? row.listing?.tags?.status),
  );

  useEffect(() => {
    setEditingSchedule(false);
    setEditingDetails(false);
    setStartDate(auction.startDate ? toLocalInput(auction.startDate) : "");
    setEndDate(auction.endDate ? toLocalInput(auction.endDate) : "");

    setListingId(auction.listingId ?? "");
    setStartingBid(auction.startingBid != null ? String(auction.startingBid) : "");
    setIncrement(auction.rules?.bidIncrement != null ? String(auction.rules.bidIncrement) : "");
    setStatus(auction.status);

    setListing(row.listing ?? null);

    const l = row.listing;
    const bi = l?.basicInformation;
    const loc = bi?.location;

    setTitle(bi?.title ?? "");
    setType(bi?.type ?? "");
    setAddress(loc?.address ?? "");
    setCity(loc?.city ?? "");
    setState(loc?.state ?? "");
    setZipcode(loc?.zipcode ?? "");
    setPrimaryImage(l?.media?.images?.[0] ?? "");
    setModerationStatus(normalizeModerationStatus(l?.moderationStatus ?? l?.tags?.status));
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

    const listingChanged =
      (currentListing?.basicInformation?.title ?? "") !== title ||
      (currentListing?.basicInformation?.type ?? "") !== type ||
      (currentListing?.basicInformation?.location?.address ?? "") !== address ||
      (currentListing?.basicInformation?.location?.city ?? "") !== city ||
      (currentListing?.basicInformation?.location?.state ?? "") !== state ||
      (currentListing?.basicInformation?.location?.zipcode ?? "") !== zipcode ||
      (currentListing?.media?.images?.[0] ?? "") !== primaryImage ||
      normalizeModerationStatus(currentListing?.moderationStatus ?? currentListing?.tags?.status) !== moderationStatus;

    const nextListingId = listingId.trim();
    const bidRaw = startingBid.trim();
    const incRaw = increment.trim();

    const bidChanged =
      bidRaw !== "" && Number.isFinite(Number(bidRaw)) && Number(bidRaw) !== Number(auction.startingBid ?? 0);

    const incChanged =
      incRaw !== "" && Number.isFinite(Number(incRaw)) && Number(incRaw) !== Number(auction.rules?.bidIncrement ?? 0);

    const listingIdChanged = nextListingId !== (auction.listingId ?? "");
    const statusChanged = status !== auction.status;

    return scheduleChanged || listingChanged || bidChanged || incChanged || listingIdChanged || statusChanged;
  }, [
    auction.startDate,
    auction.endDate,
    auction.startingBid,
    auction.rules?.bidIncrement,
    auction.listingId,
    auction.status,
    startDate,
    endDate,
    row.listing,
    listing,
    title,
    type,
    address,
    city,
    state,
    zipcode,
    primaryImage,
    moderationStatus,
    listingId,
    startingBid,
    increment,
    status,
  ]);

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

  async function handlePublish() {
    setAuctionLoading(true);
    try {
      const nextAuction = await publishAuction(auction.id); // IAuction
      onUpdate(mergeRow(nextAuction));
    } finally {
      setAuctionLoading(false);
    }
  }

  async function handleEnd() {
    setAuctionLoading(true);
    try {
      const nextAuction = await endAuction(auction.id); // IAuction
      onUpdate(mergeRow(nextAuction));
    } finally {
      setAuctionLoading(false);
    }
  }

  async function handleScheduleSave() {
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

    if (status !== auction.status) {
      patch.status = status;
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
    if (!onDelete) return;

    setAuctionLoading(true);
    try {
      await deleteAuction(auction.id);
      onDelete(auction.id);
      onClose?.();
    } finally {
      setAuctionLoading(false);
    }
  }
  async function handleSaveAll() {
    setSaveSucceeded(false);
    // Save schedule if valid + changed
    const scheduleChanged =
      (auction.startDate ? toLocalInput(auction.startDate) : "") !== startDate ||
      (auction.endDate ? toLocalInput(auction.endDate) : "") !== endDate;

    // Save listing if changed (at least title here; add other fields as you want)
    const listingChanged =
      (currentListing?.basicInformation?.title ?? "") !== title ||
      (currentListing?.basicInformation?.type ?? "") !== type ||
      (currentListing?.basicInformation?.location?.address ?? "") !== address ||
      (currentListing?.basicInformation?.location?.city ?? "") !== city ||
      (currentListing?.basicInformation?.location?.state ?? "") !== state ||
      (currentListing?.basicInformation?.location?.zipcode ?? "") !== zipcode ||
      (currentListing?.media?.images?.[0] ?? "") !== primaryImage ||
      normalizeModerationStatus(currentListing?.moderationStatus ?? currentListing?.tags?.status) !== moderationStatus;

    // Save auction details if changed
    const nextListingId = listingId.trim();
    const bidRaw = startingBid.trim();
    const incRaw = increment.trim();

    const bidChanged =
      bidRaw !== "" && Number.isFinite(Number(bidRaw)) && Number(bidRaw) !== Number(auction.startingBid ?? 0);

    const incChanged =
      incRaw !== "" && Number.isFinite(Number(incRaw)) && Number(incRaw) !== Number(auction.rules?.bidIncrement ?? 0);

    const listingIdChanged = nextListingId !== (auction.listingId ?? "");
    const statusChanged = status !== auction.status;

    // 1) schedule
    if (scheduleChanged) {
      await handleScheduleSave();
    }

    // 2) auction details
    if (listingIdChanged || bidChanged || incChanged || statusChanged) {
      await handleSaveDetails();
    }

    // 3) listing fields
    if (listingChanged) {
      await handleSaveListing();
    }

    setSaveSucceeded(true);
    setTimeout(() => {
      onClose?.();
    }, 1500);
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
        images: primaryImage
          ? [primaryImage, ...(currentListing.media?.images ?? []).filter((x) => x !== primaryImage)]
          : (currentListing.media?.images ?? []),
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
    primaryImage,
    setPrimaryImage,
    moderationStatus,
    setModerationStatus,
    handleSaveListing,

    // details
    editingDetails,
    setEditingDetails,
    listingId,
    setListingId,
    startingBid,
    setStartingBid,
    increment,
    setIncrement,
    status,
    setStatus,

    // actions
    loading,
    saveSucceeded,
    hasUnsavedChanges,
    handleCancelEdit,
    handleSaveDetails,
    handlePublish,
    handleEnd,
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
