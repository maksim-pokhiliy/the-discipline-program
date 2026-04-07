"use client";

import { useState } from "react";

import { LogoutRounded, SettingsRounded } from "@mui/icons-material";
import {
  Avatar,
  CircularProgress,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { signOut, useSession } from "@repo/auth/client";

const getInitial = (name?: string | null, email?: string | null): string => {
  const source = name || email;

  if (!source) {
    return "";
  }

  return (source[0] ?? "").toUpperCase();
};

export const PlatformUserMenu = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleSignOut = async () => {
    setAnchorEl(null);

    await signOut({ redirect: false });

    router.push("/login");
  };

  const isLoading = status === "loading";

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Avatar src={isLoading ? undefined : (session?.user?.image ?? undefined)}>
          {isLoading ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            getInitial(session?.user?.name, session?.user?.email)
          )}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            sx: { minWidth: 180, mt: 1 },
          },
        }}
      >
        <MenuItem component={Link} href="/coach/profile" onClick={() => setAnchorEl(null)}>
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
