"use client";

import { type ReactNode } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton, Stack, Paper, alpha } from "@mui/material";

export type DynamicListItemProps = {
  children: ReactNode;
  onRemove: () => void;
  disableRemove?: boolean;
  removeAriaLabel?: string;
};

export const DynamicListItem = ({
  children,
  onRemove,
  disableRemove = false,
  removeAriaLabel = "Remove item",
}: DynamicListItemProps) => {
  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        width: "100%",
        p: 3,
        borderWidth: 2,
        borderStyle: "dashed",
        transition: theme.transitions.create("border-color", {
          duration: theme.transitions.duration.standard,
        }),
        "&:hover, &:focus-within": {
          borderColor: alpha(theme.palette.common.white, 0.4),
        },
      })}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Stack spacing={2} sx={{ flex: 1 }}>
          {children}
        </Stack>

        <IconButton
          size="medium"
          color="error"
          onClick={onRemove}
          disabled={disableRemove}
          aria-label={removeAriaLabel}
          sx={{ mt: 0.5 }}
        >
          <DeleteIcon />
        </IconButton>
      </Stack>
    </Paper>
  );
};
