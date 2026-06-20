"use client";

import { useState } from "react";

import LogoutRounded from "@mui/icons-material/LogoutRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import {
  alpha,
  Avatar,
  ButtonBase,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";

const AVATAR_PX = 36;
const NAME_PX = 13;
const EMAIL_PX = 11;
const AVATAR_TINT_ALPHA = 0.18;

const getInitial = (userName?: string | null, userEmail?: string | null): string => {
  const source = userName || userEmail;

  if (!source) {
    return "";
  }

  return (source[0] ?? "").toUpperCase();
};

type PlatformSidebarUserProps = {
  profileHref: string;
  userName?: string | null | undefined;
  userEmail?: string | null | undefined;
  userImage?: string | null | undefined;
  onSignOut: () => void;
};

export const PlatformSidebarUser = ({
  profileHref,
  userName,
  userEmail,
  userImage,
  onSignOut,
}: PlatformSidebarUserProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    setAnchorEl(null);
    onSignOut();
  };

  return (
    <>
      <ButtonBase
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-label="User menu"
        sx={{
          display: "flex",
          width: "100%",
          justifyContent: "flex-start",
          px: 2,
          py: 1.75,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{ width: "100%", minWidth: 0 }}
        >
          <Avatar
            {...(userImage != null && { src: userImage })}
            sx={(theme) => ({
              width: AVATAR_PX,
              height: AVATAR_PX,
              flexShrink: 0,
              bgcolor: alpha(theme.palette.primary.main, AVATAR_TINT_ALPHA),
              color: "primary.main",
              fontSize: NAME_PX,
              fontWeight: 600,
            })}
          >
            {getInitial(userName, userEmail)}
          </Avatar>

          <Stack sx={{ flexGrow: 1, minWidth: 0, alignItems: "flex-start" }}>
            <Typography sx={{ fontSize: NAME_PX, fontWeight: 600, color: "text.primary" }} noWrap>
              {userName}
            </Typography>
            <Typography sx={{ fontSize: EMAIL_PX, color: "text.muted" }} noWrap>
              {userEmail}
            </Typography>
          </Stack>
        </Stack>
      </ButtonBase>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: "left", vertical: "bottom" }}
        anchorOrigin={{ horizontal: "left", vertical: "top" }}
        slotProps={{ paper: { sx: (theme) => ({ minWidth: theme.spacing(22.5), mb: 1 }) } }}
      >
        <MenuItem component={Link} href={profileHref} onClick={handleClose}>
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
