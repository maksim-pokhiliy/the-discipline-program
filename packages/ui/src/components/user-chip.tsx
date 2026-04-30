"use client";

import type { ReactNode } from "react";

import { Avatar, Stack, Typography } from "@mui/material";

export type UserChipUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type UserChipProps = {
  user: UserChipUser | null | undefined;
  fallback?: ReactNode;
  size?: "small" | "medium";
};

export const UserChip = ({ user, fallback = "—", size = "small" }: UserChipProps) => {
  if (!user) {
    return (
      <Typography variant="body2" color="text.secondary">
        {fallback}
      </Typography>
    );
  }

  const display = user.name?.trim() || user.email?.trim() || user.id;
  const avatarSize = size === "small" ? 24 : 32;

  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
      <Avatar
        src={user.image ?? undefined}
        sx={{ width: avatarSize, height: avatarSize, fontSize: avatarSize * 0.5 }}
      >
        {display.charAt(0).toUpperCase()}
      </Avatar>
      <Typography variant="body2" noWrap title={display} sx={{ minWidth: 0 }}>
        {display}
      </Typography>
    </Stack>
  );
};
