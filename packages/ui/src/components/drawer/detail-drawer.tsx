"use client";

import type { ReactNode } from "react";

import CloseIcon from "@mui/icons-material/Close";
import { CircularProgress, Divider, Drawer, IconButton, Stack, Typography } from "@mui/material";

import { LAYOUT } from "@repo/shared";

type DetailDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  loading?: boolean;
  children: ReactNode;
};

export const DetailDrawer = ({
  open,
  onClose,
  title,
  width = LAYOUT.detailDrawerWidth,
  loading,
  children,
}: DetailDrawerProps) => (
  <Drawer
    anchor="right"
    open={open}
    onClose={onClose}
    slotProps={{ paper: { sx: { width, maxWidth: "100%" } } }}
  >
    <Stack direction="row" alignItems="center" sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ flex: 1 }}>
        {title}
      </Typography>

      <IconButton onClick={onClose} edge="end" aria-label="Close">
        <CloseIcon />
      </IconButton>
    </Stack>

    <Divider />

    {loading ? (
      <Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
        <CircularProgress size={30} />
      </Stack>
    ) : (
      <Stack sx={{ flex: 1, overflow: "auto" }}>{children}</Stack>
    )}
  </Drawer>
);
