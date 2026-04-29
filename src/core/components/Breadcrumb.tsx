import React from "react";
import { useNavigate } from "react-router-dom";

type Mode = "overview" | "edit";

type Props = {
  auctionId: string;
  mode: Mode;
  onGoOverview: () => void;
};

export function AuctionDrawerBreadcrumb({
  auctionId,
  mode,
  onGoOverview,
}: Props) {
  const navigate = useNavigate()
  return (
    <div style={styles.wrap}>
      <div style={styles.path}>
        <span style={styles.link} onClick={()=>navigate("auctions")}>
          Auctions
        </span>

        <span style={styles.sep}>/</span>

        <span
          style={mode === "overview" ? styles.current : styles.link}
          onClick={mode === "edit" ? onGoOverview : undefined}
        >
          {auctionId}
        </span>

        {mode === "edit" && (
          <>
            <span style={styles.sep}>/</span>
            <span style={styles.current}>Edit</span>
          </>
        )}
      </div>

      <button onClick={()=>navigate("")} style={styles.close}>×</button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  path: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
  },
  link: {
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: 600,
  },
  current: {
    color: "#111827",
    fontWeight: 700,
  },
  sep: {
    color: "#9ca3af",
  },
  close: {
    fontSize: 22,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "#9ca3af",
  },
};