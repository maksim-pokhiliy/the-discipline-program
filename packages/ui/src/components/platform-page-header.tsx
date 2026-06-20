"use client";

import { type ReactNode } from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import Link from "next/link";

const TITLE_PX = 28;
const TITLE_DETAIL_PX = 26;
const EYEBROW_PX = 11;
const BACK_BUTTON_PX = 40;
const EYEBROW_LETTER_SPACING = "0.06em";

export type PlatformPageHeaderProps = {
  title: string;
  eyebrow?: string;
  backHref?: string;
  actions?: ReactNode;
};

export const PlatformPageHeader: React.FC<PlatformPageHeaderProps> = ({
  title,
  eyebrow,
  backHref,
  actions,
}) => {
  const isDetail = backHref !== undefined;

  const titleBlock = (
    <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
      {eyebrow !== undefined && (
        <Typography
          sx={{
            fontSize: EYEBROW_PX,
            fontWeight: 600,
            letterSpacing: EYEBROW_LETTER_SPACING,
            textTransform: "uppercase",
            color: "text.muted",
          }}
        >
          {eyebrow}
        </Typography>
      )}
      <Typography
        component="h1"
        sx={{
          fontSize: isDetail ? TITLE_DETAIL_PX : TITLE_PX,
          fontWeight: 600,
          lineHeight: 1,
          textTransform: "none",
          color: "text.primary",
        }}
      >
        {title}
      </Typography>
    </Stack>
  );

  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between">
      {backHref !== undefined && (
        <IconButton
          component={Link}
          href={backHref}
          aria-label="Go back"
          sx={{ width: BACK_BUTTON_PX, height: BACK_BUTTON_PX, flexShrink: 0 }}
        >
          <ArrowBackIcon />
        </IconButton>
      )}
      {titleBlock}
      {actions !== undefined && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
    </Stack>
  );
};
