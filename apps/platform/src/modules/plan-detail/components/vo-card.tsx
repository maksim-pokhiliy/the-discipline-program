"use client";

import type { ReactNode } from "react";

import CloseIcon from "@mui/icons-material/Close";
import { Box, Card, IconButton, Stack, Typography } from "@mui/material";

const REMOVE_LABEL = "Remove";
const IDX_BADGE_SIZE = 18;

type VoCardProps = {
  head: ReactNode;
  index?: number | undefined;
  onRemove?: (() => void) | undefined;
  canRemove?: boolean;
  disabled?: boolean;
  removeLabel?: string;
  children: ReactNode;
};

export const VoCard = ({
  head,
  index,
  onRemove,
  canRemove = true,
  disabled = false,
  removeLabel = REMOVE_LABEL,
  children,
}: VoCardProps) => (
  <Card variant="outlined" sx={{ bgcolor: "background.recessed", overflow: "hidden" }}>
    <Stack
      direction="row"
      spacing={1}
      sx={(theme) => ({
        alignItems: "center",
        px: 1.25,
        py: 0.75,
        bgcolor: "action.hover",
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      {index !== undefined && (
        <Box
          sx={{
            width: IDX_BADGE_SIZE,
            height: IDX_BADGE_SIZE,
            borderRadius: "50%",
            bgcolor: "text.subtle",
            color: "background.default",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Typography variant="caption" color="inherit" sx={{ fontWeight: 700, lineHeight: 1 }}>
            {index}
          </Typography>
        </Box>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
        {head}
      </Typography>

      {onRemove !== undefined && (
        <IconButton
          aria-label={removeLabel}
          size="small"
          onClick={onRemove}
          disabled={disabled || !canRemove}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </Stack>

    <Stack spacing={1.25} sx={{ p: 1.25 }}>
      {children}
    </Stack>
  </Card>
);
