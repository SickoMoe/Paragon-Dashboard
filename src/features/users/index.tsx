import React, { useMemo } from "react";
import { useRegisterDashboardFrame } from "../../core/useRegisterDashboardFrame";

export default function UsersPage() {
  const frame = useMemo(
    () => ({
      title: "Users",
      subtitle: "Manage accounts and roles",
    }),
    []
  );

  useRegisterDashboardFrame(frame);

  return <div>Users table here</div>;
}