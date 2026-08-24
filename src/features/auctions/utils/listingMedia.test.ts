import { describe, expect, it } from "vitest";
import { getListingThumbnailPath, resolveListingMediaUrl } from "./listingMedia";

const API_BASE_URL = "http://127.0.0.1:3001";

describe("listing media urls", () => {
  it("resolves seeded relative image paths against the API origin", () => {
    expect(resolveListingMediaUrl("images/auction3/img-3.1.jpeg", API_BASE_URL)).toBe(
      "http://127.0.0.1:3001/images/auction3/img-3.1.jpeg",
    );
  });

  it("keeps external thumbnail urls intact", () => {
    expect(resolveListingMediaUrl("https://cdn.example.com/thumb.jpeg", API_BASE_URL)).toBe(
      "https://cdn.example.com/thumb.jpeg",
    );
  });

  it("normalizes auction-scoped legacy paths to the static images route", () => {
    expect(resolveListingMediaUrl("auctions/AUC-XYZ123-1/images/auction3/img-3.1.jpeg", API_BASE_URL)).toBe(
      "http://127.0.0.1:3001/images/auction3/img-3.1.jpeg",
    );
  });

  it("uses thumbnailUrl before falling back to the first gallery image", () => {
    expect(
      getListingThumbnailPath({
        media: { thumbnailUrl: "images/auction5/img_1.jpeg", images: ["images/auction3/img-3.jpeg"] },
      } as any),
    ).toBe("/images/auction5/img_1.jpeg");
  });
});
