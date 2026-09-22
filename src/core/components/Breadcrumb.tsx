import React from "react";

type Mode = "overview" | "edit";

type Props = {
  auctionId: string;
  mode: Mode;
  onGoOverview: () => void;
  onGoAuctions: () => void;
  onClose: () => void;
};

export function AuctionDrawerBreadcrumb({
  auctionId,
  mode,
  onGoOverview,
  onGoAuctions,
  onClose,
}: Props) {
  return (
    <div style={styles.wrap}>
      <div style={styles.path}>
        <span style={styles.link} onClick={onGoAuctions}>
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
            <span style={styles.current}>Preparation</span>
          </>
        )}
      </div>

      <button onClick={onClose} style={styles.close} aria-label="Close auction drawer" title="Close">
        ×
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "sticky",
    top: 0,
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    margin: "-18px -18px 14px",
    padding: "12px 18px",
    borderBottom: "1px solid var(--dash-border)",
    background: "var(--dash-card)",
  },
  path: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
  },
  link: {
    color: "var(--dash-muted)",
    cursor: "pointer",
    fontWeight: 600,
  },
  current: {
    color: "var(--dash-ink)",
    fontWeight: 700,
  },
  sep: {
    color: "var(--dash-subtle)",
  },
  close: {
    fontSize: 22,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "var(--dash-muted)",
  },
};
