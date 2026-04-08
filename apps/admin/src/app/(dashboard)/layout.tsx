"use client";

import { useCallback, useState } from "react";

import { Stack } from "@mui/material";

import { AUTH_ROUTES, SessionGuard } from "@repo/auth";
import { signOut, useSession } from "@repo/auth/client";
import { ADMIN_NAVIGATION } from "@repo/shared";
import { AdminHeader, Sidebar, useSidebar } from "@repo/ui";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { expanded, toggle } = useSidebar();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMobileToggle = useCallback(() => setMobileOpen((prev) => !prev), []);
  const handleMobileClose = useCallback(() => setMobileOpen(false), []);
  const handleSignOut = useCallback(() => void signOut({ callbackUrl: AUTH_ROUTES.LOGIN }), []);

  return (
    <SessionGuard>
      <Stack direction="row" sx={{ height: "100vh" }}>
        <Sidebar
          config={ADMIN_NAVIGATION}
          expanded={expanded}
          onToggle={toggle}
          mobileOpen={mobileOpen}
          onMobileClose={handleMobileClose}
          userEmail={session?.user?.email ?? ""}
          onSignOut={handleSignOut}
        />

        <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
          <AdminHeader onMenuClick={handleMobileToggle} navigation={ADMIN_NAVIGATION} />
          <Stack sx={{ flexGrow: 1, overflow: "auto" }}>{children}</Stack>
        </Stack>
      </Stack>
    </SessionGuard>
  );
};

export default DashboardLayout;
