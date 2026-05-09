"use client";

import type { ReactNode } from "react";

import CloseIcon from "@mui/icons-material/Close";
import { Button, Divider, Drawer, IconButton, Stack, Typography } from "@mui/material";

import { LAYOUT } from "@repo/shared";

export type EditPanelProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  isDirty: boolean;
  isSaving: boolean;
  canSave: boolean;
  onSave: () => void;
  onCancel: () => void;
  children: ReactNode;
};

export const EditPanel: React.FC<EditPanelProps> = ({
  open,
  onClose,
  title,
  isSaving,
  canSave,
  onSave,
  onCancel,
  children,
}) => (
  <Drawer
    anchor="right"
    open={open}
    onClose={onClose}
    slotProps={{ paper: { sx: { width: LAYOUT.detailDrawerWidth, maxWidth: "100%" } } }}
  >
    <Stack sx={{ height: "100%" }}>
      <Stack direction="row" alignItems="center" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          {title}
        </Typography>

        <IconButton onClick={onClose} edge="end" aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Stack>

      <Divider />

      <Stack sx={{ flex: 1, overflow: "auto", p: 2 }} spacing={2}>
        {children}
      </Stack>

      <Divider />

      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ p: 2 }}>
        <Button onClick={onCancel} size="small">
          Cancel
        </Button>

        <Button variant="contained" size="small" disabled={!canSave || isSaving} onClick={onSave}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </Stack>
    </Stack>
  </Drawer>
);
