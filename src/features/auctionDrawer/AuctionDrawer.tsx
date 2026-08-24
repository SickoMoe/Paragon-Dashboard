import React from "react";
import Drawer, { type DrawerSize } from "../../core/components/Drawer";

export default function AuctionDrawer({
  onClose,
  size = 460,
  children,
}: {
  onClose: () => void;
  size?: DrawerSize;
  children: React.ReactNode;
}) {
  return (
    <Drawer open onClose={onClose} size={size} zIndex={40} showClose={false}>
      {children}
    </Drawer>
  );
}
