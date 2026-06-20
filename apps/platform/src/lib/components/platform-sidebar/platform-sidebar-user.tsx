"use client";

import { Stack, Typography } from "@mui/material";

import { PlatformUserMenu } from "@app/lib/components/platform-header";

const NAME_PX = 13;
const EMAIL_PX = 11;

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
      <PlatformUserMenu
        profileHref={profileHref}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
        onSignOut={onSignOut}
      />

      <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
        {userName && (
          <Typography sx={{ fontSize: NAME_PX, fontWeight: 600, color: "text.primary" }} noWrap>
            {userName}
          </Typography>
        )}
        {userEmail && (
          <Typography sx={{ fontSize: EMAIL_PX, color: "text.muted" }} noWrap>
            {userEmail}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};
