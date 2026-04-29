// src/routes/dashboard/components/auctionDrawer/sections/DetailsSection.tsx
import { IAuction } from "../../../interfaces/IAuction";
import { inputStyle, primaryBtn, secondaryBtn } from "../styles";
type Props = {
  editingDetails: boolean;
  setEditingDetails: (value: boolean) => void;

  listingId: string;
  setListingId: (v: string) => void;

  startingBid: string;
  setStartingBid: (v: string) => void;

  increment: string;
  setIncrement: (v: string) => void;

  status: IAuction["status"];
  setStatus: (v: IAuction["status"]) => void;

  loading: boolean;
  handleSaveDetails: () => void;
};

export function DetailsSection({
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
  loading,
  handleSaveDetails,
}: Props) {
  return (
    <section style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12, marginTop: 12 }}>
      <h4 style={{ margin: "0 0 8px" }}>Details</h4>

      {editingDetails ? (
        <>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13, display: "block" }}>Listing ID</label>
            <input value={listingId} onChange={(e) => setListingId(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13, display: "block" }}>Starting Bid</label>
            <input
              inputMode="numeric"
              value={startingBid}
              onChange={(e) => setStartingBid(e.target.value)}
              style={inputStyle}
              placeholder="e.g. 500000"
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13, display: "block" }}>Increment</label>
            <input
              inputMode="numeric"
              value={increment}
              onChange={(e) => setIncrement(e.target.value)}
              style={inputStyle}
              placeholder="e.g. 1000"
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13, display: "block" }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as IAuction["status"])}
              style={inputStyle}
            >
              <option value="draft">draft</option>
              <option value="scheduled">scheduled</option>
              <option value="live">live</option>
              <option value="ended">ended</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={handleSaveDetails} disabled={loading} style={primaryBtn}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button onClick={() => setEditingDetails(false)} style={secondaryBtn}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <button onClick={() => setEditingDetails(true)} style={secondaryBtn}>
          ✏️ Edit Details
        </button>
      )}
    </section>
  );
}