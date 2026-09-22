import { describe, it, expect } from "vitest";
import {
  configurationChecks,
  destination,
  preparationStatus,
  accountIds,
  type Setup,
} from "./preparation";
import type { AuctionOverview } from "../auctions/types";
const form: Setup = {
  startingBid: "100",
  increment: "10",
  reserve: "",
  startDate: "2098-01-01T12:00",
  endDate: "2099-01-01T12:00",
  isPrivate: false,
  authorized: "",
};
describe("preparation checklist", () => {
  it("accepts complete setup and optional empty reserve", () =>
    expect(configurationChecks(form).every((c) => c.satisfied)).toBe(true));
  it("does not treat blank or invalid prices as saved valid values", () => {
    const checks = configurationChecks({
      ...form,
      startingBid: "",
      increment: "invalid",
      reserve: "-4",
    });
    expect(checks.filter((c) => !c.satisfied).map((c) => c.code)).toEqual([
      "starting_bid",
      "increment",
      "reserve",
    ]);
  });
  it("requires future end, sensible reserve and private access", () => {
    const checks = configurationChecks({
      ...form,
      endDate: "2000-01-01",
      reserve: "99",
      isPrivate: true,
    });
    expect(checks.filter((c) => !c.satisfied).map((c) => c.code)).toEqual([
      "end_date",
      "reserve",
      "private_access",
    ]);
    expect(accountIds("a, b\na\n ")).toEqual(["a", "b"]);
  });
  it("routes verification and listing blockers to their correct sections", () => {
    expect(destination("document:proof_authority")).toBe("verification");
    expect(destination("authority_verified")).toBe("verification");
    expect(destination("auction_terms")).toBe("property");
    expect(destination("starting_bid")).toBe("setup");
  });
  it("shows the first operational blocker in table rows", () => {
    const row = {
      auction: { status: "draft" },
      preparationReadiness: {
        ready: false,
        checks: [
          { code: "authority_verified", satisfied: false },
          { code: "starting_bid", satisfied: false },
        ],
      },
    } as AuctionOverview;
    expect(preparationStatus(row)).toBe("Needs authority verification");
    expect(preparationStatus({ ...row, auction: { ...row.auction, status: "live" } })).toBe("Live");
    expect(preparationStatus({ ...row, auction: { ...row.auction, status: "scheduled" } })).toBe(
      "Scheduled · blocked",
    );
  });
});
