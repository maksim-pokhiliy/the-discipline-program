"use client";

import { useCallback, useState } from "react";

import { Stack } from "@mui/material";

import { ADMIN_NAVIGATION } from "@repo/shared";
import { AdminHeader, Sidebar, useSidebar } from "@repo/ui";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { expanded, toggle } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMobileToggle = useCallback(() => setMobileOpen((prev) => !prev), []);
  const handleMobileClose = useCallback(() => setMobileOpen(false), []);

  return (
    <Stack direction="row">
      <Sidebar
        config={ADMIN_NAVIGATION}
        expanded={expanded}
        onToggle={toggle}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
      />

      <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
        <AdminHeader onMenuClick={handleMobileToggle} />
        {children}
      </Stack>
    </Stack>
  );
}
