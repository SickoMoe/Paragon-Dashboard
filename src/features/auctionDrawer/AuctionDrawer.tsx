import React from "react";
import Drawer from "../../core/components/Drawer";

export default function AuctionDrawer({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Drawer open onClose={onClose} size={460} zIndex={40} showClose={false}>
      {children}
    </Drawer>
  );
}