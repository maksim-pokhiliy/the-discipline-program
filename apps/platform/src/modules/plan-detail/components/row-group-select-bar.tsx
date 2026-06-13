"use client";

import { type ReactElement } from "react";

import { Button, Stack, Typography, alpha } from "@mui/material";

const BAR_PX_FACTOR = 1.5;
const BAR_PY_FACTOR = 1;
const BAR_GAP_FACTOR = 1.5;
const BAR_BORDER_ALPHA = 0.25;
const BAR_BG_ALPHA = 0.04;
const MIN_GROUP_SELECTION = 2;
const CANCEL_LABEL = "Cancel";
const GROUP_LABEL = "Group rows";

const selectedLabel = (count: number): string => `${count} selected`;

type RowGroupSelectBarProps = {
  selectedCount: number;
  isPending: boolean;
  onCancel: () => void;
  onGroup: () => void;
};

export const RowGroupSelectBar: React.FC<RowGroupSelectBarProps> = ({
  selectedCount,
  isPending,
  onCancel,
  onGroup,
}): ReactElement => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={BAR_GAP_FACTOR}
    sx={(theme) => ({
      px: theme.spacing(BAR_PX_FACTOR),
      py: theme.spacing(BAR_PY_FACTOR),
      borderTop: `1px solid ${alpha(theme.palette.primary.main, BAR_BORDER_ALPHA)}`,
      bgcolor: alpha(theme.palette.primary.main, BAR_BG_ALPHA),
    })}
  >
    <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
      {selectedLabel(selectedCount)}
    </Typography>

    <Button size="tiny" variant="text" color="inherit" onClick={onCancel} disabled={isPending}>
      {CANCEL_LABEL}
    </Button>

    <Button
      size="tiny"
      variant="contained"
      onClick={onGroup}
      disabled={selectedCount < MIN_GROUP_SELECTION || isPending}
    >
      {GROUP_LABEL}
    </Button>
  </Stack>
);
