"use client";

import { type ReactElement, type ReactNode } from "react";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton, Stack, Paper, alpha } from "@mui/material";

import { useMoveFocus } from "./use-move-focus";

export type DynamicListItemProps = {
  children: ReactNode;
  itemLabel: string;
  onRemove?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
};

const UNAVAILABLE_MOVE_SX = {
  color: "action.disabled",
  cursor: "default",
  "&:hover": { backgroundColor: "transparent" },
  "&:active": { transform: "none" },
};

export const DynamicListItem = ({
  children,
  itemLabel,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
}: DynamicListItemProps): ReactElement => {
  const { moveUpRef, moveDownRef, moveKeepingFocus } = useMoveFocus();

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

        {(onRemove || (onMoveUp && onMoveDown)) && (
          <Stack sx={{ mt: 0.5 }}>
            {onMoveUp && onMoveDown && (
              <>
                <IconButton
                  size="medium"
                  ref={moveUpRef}
                  onClick={() => {
                    if (canMoveUp) {
                      moveKeepingFocus("up", onMoveUp);
                    }
                  }}
                  aria-disabled={!canMoveUp}
                  sx={canMoveUp ? {} : UNAVAILABLE_MOVE_SX}
                  aria-label={`Move ${itemLabel} up`}
                >
                  <ArrowUpwardIcon />
                </IconButton>
                <IconButton
                  size="medium"
                  ref={moveDownRef}
                  onClick={() => {
                    if (canMoveDown) {
                      moveKeepingFocus("down", onMoveDown);
                    }
                  }}
                  aria-disabled={!canMoveDown}
                  sx={canMoveDown ? {} : UNAVAILABLE_MOVE_SX}
                  aria-label={`Move ${itemLabel} down`}
                >
                  <ArrowDownwardIcon />
                </IconButton>
              </>
            )}
            {onRemove && (
              <IconButton
                size="medium"
                color="error"
                onClick={onRemove}
                aria-label={`Remove ${itemLabel}`}
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};
