"use client";

import { type ReactElement } from "react";

import { alpha, Avatar, Box, Stack, Typography } from "@mui/material";

import { useSession } from "@repo/auth/client";

import {
  CARD_GAP,
  CARD_PADDING,
  CARD_RADIUS_PX,
  FONT_WEIGHT_DISPLAY,
  FONT_WEIGHT_SEMI_BOLD,
  IDENTITY_AVATAR_BG_ALPHA,
  IDENTITY_AVATAR_BORDER_ALPHA,
  IDENTITY_AVATAR_PX,
  IDENTITY_NAME_PX,
  ROLE_BADGE_BG_ALPHA,
  ROLE_BADGE_LABEL,
  ROLE_BADGE_LETTER_SPACING,
  ROLE_BADGE_PADDING_X_PX,
  ROLE_BADGE_PADDING_Y_PX,
  ROLE_BADGE_PX,
} from "../utils/athlete-profile.constants";

const getInitial = (name?: string | null, email?: string | null): string => {
  const source = name || email;

  if (!source) {
    return "";
  }

  return (source[0] ?? "").toUpperCase();
};

export const ProfileIdentityCard = (): ReactElement => {
  const { data } = useSession();
  const user = data?.user;
  const name = user?.name ?? "";
  const image = user?.image ?? null;

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
      <Avatar
        variant="rounded"
        {...(image != null && { src: image })}
        sx={(theme) => ({
          width: IDENTITY_AVATAR_PX,
          height: IDENTITY_AVATAR_PX,
          borderRadius: `${CARD_RADIUS_PX}px`,
          fontFamily: theme.typography.h4.fontFamily,
          fontWeight: FONT_WEIGHT_DISPLAY,
          color: theme.palette.primary.main,
          bgcolor: alpha(theme.palette.primary.main, IDENTITY_AVATAR_BG_ALPHA),
          border: `1px solid ${alpha(theme.palette.primary.main, IDENTITY_AVATAR_BORDER_ALPHA)}`,
        })}
      >
        {getInitial(name, user?.email)}
      </Avatar>

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
