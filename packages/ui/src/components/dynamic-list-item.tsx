"use client";

import { type ReactElement, type ReactNode } from "react";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton, Stack, Paper, alpha } from "@mui/material";

export type DynamicListItemProps = {
  children: ReactNode;
  onRemove: () => void;
  disableRemove?: boolean;
  removeAriaLabel?: string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  disableMoveUp?: boolean;
  disableMoveDown?: boolean;
};

export const DynamicListItem = ({
  children,
  onRemove,
  disableRemove = false,
  removeAriaLabel = "Remove item",
  onMoveUp,
  onMoveDown,
  disableMoveUp = false,
  disableMoveDown = false,
}: DynamicListItemProps): ReactElement => {
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

        <Stack sx={{ mt: 0.5 }}>
          {onMoveUp && onMoveDown && (
            <>
              <IconButton
                size="medium"
                onClick={onMoveUp}
                disabled={disableMoveUp}
                aria-label="Move up"
              >
                <ArrowUpwardIcon />
              </IconButton>
              <IconButton
                size="medium"
                onClick={onMoveDown}
                disabled={disableMoveDown}
                aria-label="Move down"
              >
                <ArrowDownwardIcon />
              </IconButton>
            </>
          )}
          <IconButton
            size="medium"
            color="error"
            onClick={onRemove}
            disabled={disableRemove}
            aria-label={removeAriaLabel}
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Paper>
  );
};
