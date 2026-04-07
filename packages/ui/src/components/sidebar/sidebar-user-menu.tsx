"use client";

import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import { Avatar, IconButton, Stack, Tooltip, Typography } from "@mui/material";

import { signOut, useSession } from "@repo/auth";

type SidebarUserMenuProps = {
  expanded: boolean;
};

export const SidebarUserMenu = ({ expanded }: SidebarUserMenuProps) => {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  const handleLogout = () => {
    void signOut({ callbackUrl: "/login" });
  };

  const email = session.user?.email ?? "";

  const avatar = (
    <Avatar sx={{ width: 32, height: 32 }}>
      <AccountCircleIcon />
    </Avatar>
  );

  if (!expanded) {
    return (
      <Stack sx={{ alignItems: "center", py: 1, gap: 0.5 }}>
        <Tooltip title={email} placement="right">
          <IconButton>{avatar}</IconButton>
        </Tooltip>

        <Tooltip title="Logout" placement="right">
          <IconButton size="medium" onClick={handleLogout}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    );
  }

  return (
    <Stack direction="row" sx={{ alignItems: "center", px: 2, py: 1.5, gap: 1.5 }}>
      {avatar}

      <Typography variant="body2" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
        {email}
      </Typography>

      <IconButton onClick={handleLogout} edge="end">
        <LogoutIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
};
