// src/routes/dashboard/components/auctionDrawer/sections/ScheduleSection.tsx
import { inputStyle, primaryBtn, secondaryBtn } from "../styles";
type Props = {
  editingSchedule: boolean;
  setEditingSchedule: (value: boolean) => void;

  startDate: string;
  setStartDate: (value: string) => void;

  endDate: string;
  setEndDate: (value: string) => void;

  loading: boolean;
  handleScheduleSave: () => void;
};

export function ScheduleSection({
  editingSchedule,
  setEditingSchedule,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  loading,
  handleScheduleSave,
}: Props) {
  return (
    <section style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12, marginTop: 12 }}>
      <h4 style={{ margin: "0 0 8px" }}>Schedule</h4>

      {editingSchedule ? (
        <>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13, display: "block" }}>Start Date/Time</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13, display: "block" }}>End Date/Time</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={handleScheduleSave} disabled={loading} style={primaryBtn}>
              {loading ? "Saving..." : "Save Schedule"}
            </button>
            <button onClick={() => setEditingSchedule(false)} style={secondaryBtn}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <button onClick={() => setEditingSchedule(true)} style={secondaryBtn}>
          ✏️ Edit Schedule
        </button>
      )}
    </section>
  );
}