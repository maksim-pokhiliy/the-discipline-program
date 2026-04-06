"use client";

import type { ReactNode } from "react";

import CloseIcon from "@mui/icons-material/Close";
import { CircularProgress, Divider, Drawer, IconButton, Stack, Typography } from "@mui/material";

const DEFAULT_WIDTH = 420;

type DetailDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  loading?: boolean;
  children: ReactNode;
};

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  open,
  onClose,
  title,
  width = DEFAULT_WIDTH,
  loading,
  children,
}) => (
  <Drawer
    anchor="right"
    open={open}
    onClose={onClose}
    slotProps={{ paper: { sx: { width, maxWidth: "100%" } } }}
  >
    <Stack direction="row" sx={{ p: 2, alignItems: "center" }}>
      <Typography variant="h6" sx={{ flex: 1 }}>
        {title}
      </Typography>

      <IconButton onClick={onClose} edge="end">
        <CloseIcon />
      </IconButton>
    </Stack>

    <Divider />

    {loading ? (
      <Stack sx={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={30} />
      </Stack>
    ) : (
      <Stack sx={{ flex: 1, overflow: "auto" }}>{children}</Stack>
    )}
  </Drawer>
);
