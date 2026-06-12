"use client";

import { type ReactElement } from "react";

import { Box, ButtonBase, Tooltip, alpha } from "@mui/material";

import {
  PARALLEL_INTERLEAVE_ORDERS,
  type ParallelInterleaveOrder,
} from "@repo/contracts/lms/schema-group";

const SEG_GROUP_ARIA = "Interleave order";
const SEG_TOOLTIP = "Interleave order — how tracks weave together";
const SEG_BORDER_RADIUS_FACTOR = 0.5;
const SEG_BUTTON_PADDING_X_FACTOR = 1.5;
const SEG_BUTTON_PADDING_Y_PX = 7;
const SEG_BUTTON_FONT_SIZE_PX = 12;
const SEG_BUTTON_FONT_WEIGHT = 600;
const SEG_ACTIVE_BG_ALPHA = 0.14;

const INTERLEAVE_ORDER_LABELS: Record<ParallelInterleaveOrder, string> = {
  round_by_round: "round by round",
  track_by_track: "track by track",
};

type InterleaveSegControlProps = {
  value: ParallelInterleaveOrder;
  onChange: (order: ParallelInterleaveOrder) => void;
  disabled?: boolean;
};

export const InterleaveSegControl: React.FC<InterleaveSegControlProps> = ({
  value,
  onChange,
  disabled = false,
}): ReactElement => {
  const handleSelect = (order: ParallelInterleaveOrder) => {
    if (order === value) {
      return;
    }

    onChange(order);
  };

  return (
    <Tooltip title={SEG_TOOLTIP}>
      <Box
        role="group"
        aria-label={SEG_GROUP_ARIA}
        sx={(theme) => ({
          display: "inline-flex",
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: theme.spacing(SEG_BORDER_RADIUS_FACTOR),
          overflow: "hidden",
        })}
      >
        {PARALLEL_INTERLEAVE_ORDERS.map((order) => {
          const isActive = order === value;

          return (
            <ButtonBase
              key={order}
              aria-pressed={isActive}
              disabled={disabled}
              onClick={() => handleSelect(order)}
              sx={(theme) => ({
                px: SEG_BUTTON_PADDING_X_FACTOR,
                py: `${SEG_BUTTON_PADDING_Y_PX}px`,
                fontFamily: theme.typography.body1.fontFamily,
                fontSize: SEG_BUTTON_FONT_SIZE_PX,
                fontWeight: SEG_BUTTON_FONT_WEIGHT,
                whiteSpace: "nowrap",
                backgroundColor: isActive
                  ? alpha(theme.palette.primary.main, SEG_ACTIVE_BG_ALPHA)
                  : "transparent",
                color: isActive ? "primary.main" : "text.secondary",
                borderRight: `1px solid ${theme.palette.divider}`,
                "&:last-of-type": { borderRight: "none" },
                transition: theme.transitions.create(["background-color", "color"], {
                  duration: theme.transitions.duration.shortest,
                }),
                "&:hover": {
                  backgroundColor: isActive
                    ? alpha(theme.palette.primary.main, SEG_ACTIVE_BG_ALPHA)
                    : "action.hover",
                  color: isActive ? "primary.main" : "text.primary",
                },
              })}
            >
              {INTERLEAVE_ORDER_LABELS[order]}
            </ButtonBase>
          );
        })}
      </Box>
    </Tooltip>
  );
};
