"use client";

import { useState } from "react";

import { LogoutRounded, SettingsRounded } from "@mui/icons-material";
import { Avatar, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import Link from "next/link";

const getInitial = (name?: string | null, email?: string | null): string => {
  const source = name || email;

  if (!source) {
    return "";
  }

  return (source[0] ?? "").toUpperCase();
};

type PlatformUserMenuProps = {
  profileHref?: string;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  onSignOut: () => void;
};

export const PlatformUserMenu = ({
  profileHref = "/profile",
  userName,
  userEmail,
  userImage,
  onSignOut,
}: PlatformUserMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleSignOut = () => {
    setAnchorEl(null);
    onSignOut();
  };

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Avatar src={userImage ?? undefined}>{getInitial(userName, userEmail)}</Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            sx: (theme) => ({ minWidth: theme.spacing(22.5), mt: 1 }),
          },
        }}
      >
        <MenuItem component={Link} href={profileHref} onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <SettingsRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <LogoutRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sign Out</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};
