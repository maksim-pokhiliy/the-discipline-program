"use client";

import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import { Avatar, IconButton, Stack, Tooltip, Typography } from "@mui/material";

type SidebarUserMenuProps = {
  expanded: boolean;
  email: string;
  onSignOut: () => void;
};

export const SidebarUserMenu = ({ expanded, email, onSignOut }: SidebarUserMenuProps) => {
  const avatar = (
    <Avatar sx={(theme) => ({ width: theme.spacing(4), height: theme.spacing(4) })}>
      <AccountCircleIcon />
    </Avatar>
  );

  if (!expanded) {
    return (
      <Stack alignItems="center" spacing={0.5} sx={{ py: 1 }}>
        <Tooltip title={email} placement="right">
          <IconButton aria-label="User profile">{avatar}</IconButton>
        </Tooltip>

        <Tooltip title="Logout" placement="right">
          <IconButton size="medium" onClick={onSignOut} aria-label="Logout">
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    );
  }

  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2, py: 1.5 }}>
      {avatar}

      <Typography variant="body2" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
        {email}
      </Typography>

      <IconButton onClick={onSignOut} edge="end" aria-label="Logout">
        <LogoutIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
};
