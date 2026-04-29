const TONES = {
  blue: {
    bg: "linear-gradient(180deg, #eff6ff, #ffffff)",
    accent: "#2563eb",
  },
  green: {
    bg: "linear-gradient(180deg, #ecfdf5, #ffffff)",
    accent: "#059669",
  },
  purple: {
    bg: "linear-gradient(180deg, #f5f3ff, #ffffff)",
    accent: "#7c3aed",
  },
  amber: {
    bg: "linear-gradient(180deg, #fffbeb, #ffffff)",
    accent: "#d97706",
  },
};

export function StatTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: keyof typeof TONES;
}) {
  const t = TONES[tone];

  return (
    <div
      style={{
        minWidth: 190,
        padding: "14px 16px",
        borderRadius: 14,
        background: t.bg,
        border: "1px solid #e5e7eb",
        transition: "transform 160ms ease, box-shadow 160ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow =
          "0 6px 20px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: t.accent,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          marginTop: 6,
          color: "#111827",
        }}
      >
        {value}
      </div>

      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}