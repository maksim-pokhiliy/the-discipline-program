"use client";

import { type ReactElement } from "react";

import { alpha, Box, Stack, Typography } from "@mui/material";

import { useSession } from "@repo/auth/client";

import { ProfileAvatar } from "@app/lib/components";

import {
  CARD_GAP,
  CARD_PADDING,
  CARD_RADIUS_PX,
  FONT_WEIGHT_SEMI_BOLD,
  IDENTITY_NAME_PX,
  ROLE_BADGE_BG_ALPHA,
  ROLE_BADGE_LABEL,
  ROLE_BADGE_LETTER_SPACING,
  ROLE_BADGE_PADDING_X_PX,
  ROLE_BADGE_PADDING_Y_PX,
  ROLE_BADGE_PX,
} from "../utils/athlete-profile.constants";

export type ProfileIdentityCardProps = {
  image: string | null;
  isUploadingAvatar: boolean;
  onSelectAvatarFile: (file: File) => void;
};

export const ProfileIdentityCard = ({
  image,
  isUploadingAvatar,
  onSelectAvatarFile,
}: ProfileIdentityCardProps): ReactElement => {
  const { data } = useSession();
  const user = data?.user;
  const name = user?.name ?? "";
  const email = user?.email ?? "";

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={CARD_GAP}
      sx={(theme) => ({
        p: CARD_PADDING,
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: `${CARD_RADIUS_PX}px`,
      })}
    >
      <ProfileAvatar
        name={name}
        email={email}
        image={image}
        isUploading={isUploadingAvatar}
        onFileSelect={onSelectAvatarFile}
      />

      <Typography
        component="div"
        sx={(theme) => ({
          flex: 1,
          minWidth: 0,
          fontSize: theme.typography.pxToRem(IDENTITY_NAME_PX),
          fontWeight: FONT_WEIGHT_SEMI_BOLD,
          color: theme.palette.text.primary,
        })}
      >
        {name}
      </Typography>

      <Box
        component="span"
        sx={(theme) => ({
          px: `${ROLE_BADGE_PADDING_X_PX}px`,
          py: `${ROLE_BADGE_PADDING_Y_PX}px`,
          borderRadius: `${CARD_RADIUS_PX}px`,
          fontSize: theme.typography.pxToRem(ROLE_BADGE_PX),
          fontWeight: FONT_WEIGHT_SEMI_BOLD,
          letterSpacing: ROLE_BADGE_LETTER_SPACING,
          textTransform: "uppercase",
          color: theme.palette.primary.main,
          bgcolor: alpha(theme.palette.primary.main, ROLE_BADGE_BG_ALPHA),
        })}
      >
        {ROLE_BADGE_LABEL}
      </Box>
    </Stack>
  );
};
