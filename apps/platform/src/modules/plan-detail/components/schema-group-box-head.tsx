"use client";

import { type ReactElement } from "react";

import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import SplitscreenIcon from "@mui/icons-material/Splitscreen";
import ViewColumnOutlinedIcon from "@mui/icons-material/ViewColumnOutlined";
import { IconButton, Stack, Tooltip, Typography, alpha } from "@mui/material";

import { SCHEMA_CONSTANTS } from "@repo/contracts/lms/schema";
import { type ParallelInterleaveOrder, type SchemaGroup } from "@repo/contracts/lms/schema-group";
import { InlineEditText } from "@repo/ui";

import { InterleaveSegControl } from "./interleave-seg-control";

const HEAD_ICON_PX = 18;
const HEAD_ACTION_ICON_PX = 17;
const HEAD_SPACING = 1;
const HEAD_PX = 1.5;
const HEAD_PY = 1;
const HEAD_BORDER_ALPHA = 0.25;
const DRAG_ARIA = "Drag group";
const OVERLINE_TEXT = "GROUP";
const LABEL_ARIA = "Group label";
const LABEL_PLACEHOLDER = "group label…";
const UNGROUP_LABEL = "Ungroup";
const DELETE_LABEL = "Delete group";

const tooltipChildSx = { display: "inline-flex" };

type SchemaGroupBoxHeadProps = {
  group: SchemaGroup;
  isUpdatePending: boolean;
  dragAttributes: DraggableAttributes;
  dragListeners: DraggableSyntheticListeners;
  onLabelCommit: (next: string) => void;
  onInterleaveChange: (order: ParallelInterleaveOrder) => void;
  onUngroupOpen: () => void;
  onDeleteOpen: () => void;
};

export const SchemaGroupBoxHead: React.FC<SchemaGroupBoxHeadProps> = ({
  group,
  isUpdatePending,
  dragAttributes,
  dragListeners,
  onLabelCommit,
  onInterleaveChange,
  onUngroupOpen,
  onDeleteOpen,
}): ReactElement => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={HEAD_SPACING}
    useFlexGap
    flexWrap="wrap"
    sx={(theme) => ({
      px: HEAD_PX,
      py: HEAD_PY,
      borderBottom: `1px solid ${alpha(theme.palette.primary.main, HEAD_BORDER_ALPHA)}`,
    })}
  >
    <IconButton
      {...dragAttributes}
      {...dragListeners}
      size="small"
      aria-label={DRAG_ARIA}
      disabled={isUpdatePending}
      sx={{
        cursor: "grab",
        touchAction: "none",
        "&.Mui-focusVisible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 2,
        },
      }}
    >
      <DragIndicatorIcon fontSize="small" />
    </IconButton>

    <ViewColumnOutlinedIcon sx={{ fontSize: HEAD_ICON_PX, color: "primary.main" }} />

    <Typography variant="overline" color="primary.main">
      {OVERLINE_TEXT}
    </Typography>

    <InlineEditText
      value={group.label ?? ""}
      onCommit={onLabelCommit}
      variant="subtitle1"
      ariaLabel={LABEL_ARIA}
      emptyIsValid
      maxLength={SCHEMA_CONSTANTS.MAX_HEADER_LENGTH}
      placeholder={LABEL_PLACEHOLDER}
      sx={{ flex: 1, minWidth: 0 }}
    />

    <InterleaveSegControl
      value={group.interleaveOrder}
      onChange={onInterleaveChange}
      disabled={isUpdatePending}
    />

    <Tooltip title={UNGROUP_LABEL}>
      <span style={tooltipChildSx}>
        <IconButton size="small" aria-label={UNGROUP_LABEL} onClick={onUngroupOpen}>
          <SplitscreenIcon sx={{ fontSize: HEAD_ACTION_ICON_PX }} />
        </IconButton>
      </span>
    </Tooltip>

    <Tooltip title={DELETE_LABEL}>
      <span style={tooltipChildSx}>
        <IconButton
          size="small"
          aria-label={DELETE_LABEL}
          onClick={onDeleteOpen}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon sx={{ fontSize: HEAD_ACTION_ICON_PX }} />
        </IconButton>
      </span>
    </Tooltip>
  </Stack>
);
