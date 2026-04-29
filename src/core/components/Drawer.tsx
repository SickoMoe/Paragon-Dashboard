import React, { useEffect } from "react";

export type DrawerSide = "right" | "left";

export type DrawerSize = "sm" | "md" | "lg" | number;

function resolveWidth(size: DrawerSize | undefined) {
  if (typeof size === "number") return size;
  if (size === "sm") return 360;
  if (size === "lg") return 520;
  return 420; // md default
}

export default function Drawer(props: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;

  title?: string;
  header?: React.ReactNode;

  side?: DrawerSide;
  size?: DrawerSize;
  zIndex?: number;

  /** default true */
  closeOnOverlayClick?: boolean;

  /** offset for stacked panels (ex: detail panel sits left of bids panel) */
  rightOffset?: number;
  leftOffset?: number;

  /** default true */
  showClose?: boolean;
}) {
  const {
    open,
    onClose,
    children,
    title,
    header,
    side = "right",
    size = "md",
    zIndex = 60,
    closeOnOverlayClick = true,
    rightOffset = 0,
    leftOffset = 0,
    showClose = true,
  } = props;

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const width = resolveWidth(size);

  const panelStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    width,
    background: "#fff",
    boxShadow:
      side === "right"
        ? "-12px 0 30px rgba(0,0,0,0.25)"
        : "12px 0 30px rgba(0,0,0,0.25)",
    padding: 16,
    overflowY: "auto",
    ...(side === "right" ? { right: rightOffset } : { left: leftOffset }),
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex }}>
      <div
        onClick={closeOnOverlayClick ? onClose : undefined}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
        }}
      />

      <aside role="dialog" aria-modal="true" style={panelStyle}>
        {header ? (
          header
        ) : title ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <h4 style={{ margin: 0 }}>{title}</h4>
            {showClose ? (
              <button
                onClick={onClose}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 22,
                  cursor: "pointer",
                  color: "#9ca3af",
                }}
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            ) : null}
          </div>
        ) : showClose ? (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 22,
                cursor: "pointer",
                color: "#9ca3af",
              }}
              aria-label="Close"
              title="Close"
            >
              ×
            </button>
          </div>
        ) : null}

        {children}
      </aside>
    </div>
  );
}