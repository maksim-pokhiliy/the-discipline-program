"use client";

import { alpha, Avatar, Stack, Typography } from "@mui/material";

import { PlatformUserMenu } from "@app/lib/components/platform-header";

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
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{ px: 2, py: 1.75, borderTop: 1, borderColor: "divider" }}
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

      <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: NAME_PX, fontWeight: 600, color: "text.primary" }} noWrap>
          {userName}
        </Typography>
        <Typography sx={{ fontSize: EMAIL_PX, color: "text.muted" }} noWrap>
          {userEmail}
        </Typography>
      </Stack>

      <PlatformUserMenu
        profileHref={profileHref}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
        onSignOut={onSignOut}
      />
    </Stack>
  );
};
