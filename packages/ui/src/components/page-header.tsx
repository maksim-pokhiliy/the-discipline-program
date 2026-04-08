"use client";

import type { ReactNode } from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { IconButton, Stack, Typography } from "@mui/material";
import Link from "next/link";

type PageHeaderProps = {
  title: string;
  backHref?: string;
  actions?: ReactNode;
};

export const PageHeader: React.FC<PageHeaderProps> = ({ title, backHref, actions }) => (
  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
    {backHref && (
      <IconButton component={Link} href={backHref}>
        <ArrowBackIcon />
      </IconButton>
    )}

    <Typography variant="h3" noWrap sx={{ flex: 1 }}>
      {title}
    </Typography>

    {actions}
  </Stack>
);
