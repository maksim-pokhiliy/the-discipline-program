"use client";

import { useCallback, useState } from "react";

import { Stack } from "@mui/material";

import { SessionGuard } from "@repo/auth";
import { ADMIN_NAVIGATION } from "@repo/shared";
import { AdminHeader, Sidebar, useSidebar } from "@repo/ui";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { expanded, toggle } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMobileToggle = useCallback(() => setMobileOpen((prev) => !prev), []);
  const handleMobileClose = useCallback(() => setMobileOpen(false), []);

  return (
    <SessionGuard>
      <Stack direction="row" sx={{ height: "100vh" }}>
        <Sidebar
          config={ADMIN_NAVIGATION}
          expanded={expanded}
          onToggle={toggle}
          mobileOpen={mobileOpen}
          onMobileClose={handleMobileClose}
        />

        <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
          <AdminHeader onMenuClick={handleMobileToggle} />
          <Stack sx={{ flexGrow: 1, overflow: "auto" }}>{children}</Stack>
        </Stack>
      </Stack>
    </SessionGuard>
  );
};

export default DashboardLayout;
