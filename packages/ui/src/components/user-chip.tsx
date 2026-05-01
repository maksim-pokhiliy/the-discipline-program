"use client";

import type { ReactNode } from "react";

import { Avatar, Stack, Typography } from "@mui/material";

export type UserChipUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type UserChipSize = "small" | "medium" | "large";

export type UserChipProps = {
  user: UserChipUser | null | undefined;
  fallback?: ReactNode;
  size?: UserChipSize;
  secondary?: ReactNode;
};

const AVATAR_SIZE: Record<UserChipSize, number> = {
  small: 24,
  medium: 32,
  large: 56,
};

const TYPOGRAPHY_VARIANT: Record<UserChipSize, "body2" | "subtitle2" | "subtitle1"> = {
  small: "body2",
  medium: "subtitle2",
  large: "subtitle1",
};

export const UserChip = ({ user, fallback = "—", size = "small", secondary }: UserChipProps) => {
  if (!user) {
    return (
      <Typography variant="body2" color="text.secondary">
        {fallback}
      </Typography>
    );
  }

  const display = user.name?.trim() || user.email?.trim() || user.id;
  const avatarSize = AVATAR_SIZE[size];
  const stackSpacing = size === "large" ? 2 : 1;
  const secondaryNode =
    secondary === undefined && size === "large" && user.name?.trim() && user.email?.trim() ? (
      <Typography variant="body2" color="text.secondary" noWrap>
        {user.email}
      </Typography>
    ) : (
      secondary
    );

  return (
    <Stack direction="row" spacing={stackSpacing} alignItems="center" sx={{ minWidth: 0 }}>
      <Avatar
        src={user.image ?? undefined}
        alt={display}
        sx={{ width: avatarSize, height: avatarSize, fontSize: avatarSize * 0.5 }}
      >
        {display.charAt(0).toUpperCase()}
      </Avatar>
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Typography variant={TYPOGRAPHY_VARIANT[size]} noWrap title={display} sx={{ minWidth: 0 }}>
          {display}
        </Typography>
        {secondaryNode}
      </Stack>
    </Stack>
  );
};
