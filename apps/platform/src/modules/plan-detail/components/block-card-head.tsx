"use client";

import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import TuneIcon from "@mui/icons-material/Tune";
import { IconButton, Stack, Tooltip } from "@mui/material";

import type { Block } from "@repo/contracts/lms/block";
import type { Label } from "@repo/contracts/lms/label";
import { LabelPickerChip } from "@repo/ui";

const DRAG_ARIA = "Drag block";
const EDIT_ARIA = "Edit block details";
const EDIT_TOOLTIP = "Edit block details";
const DELETE_ARIA = "Delete block";
const DELETE_TOOLTIP = "Delete block";
const LABELS_ARIA = "Block labels";

const tooltipChildSx = { display: "inline-flex" };

type BlockCardHeadProps = {
  block: Block;
  labelOptions: Label[];
  isLabelsLoading: boolean;
  isMutationPending: boolean;
  dragAttributes: DraggableAttributes;
  dragListeners: DraggableSyntheticListeners;
  onLabelsChange: (labelIds: string[]) => void;
  onEditOpen: () => void;
  onDeleteOpen: () => void;
};

export const BlockCardHead: React.FC<BlockCardHeadProps> = ({
  block,
  labelOptions,
  isLabelsLoading,
  isMutationPending,
  dragAttributes,
  dragListeners,
  onLabelsChange,
  onEditOpen,
  onDeleteOpen,
}) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1}
    sx={(theme) => ({
      px: theme.spacing(1.5),
      py: theme.spacing(1.25),
      minWidth: 0,
      borderBottom: 1,
      borderColor: "divider",
    })}
  >
    <IconButton
      {...dragAttributes}
      {...dragListeners}
      size="small"
      aria-label={DRAG_ARIA}
      disabled={isMutationPending}
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

    <Stack
      direction="row"
      alignItems="center"
      spacing={0.75}
      useFlexGap
      flexWrap="wrap"
      sx={{ flex: 1, minWidth: 0 }}
    >
      <LabelPickerChip
        multiple
        value={block.labels}
        options={labelOptions}
        level="BLOCK"
        isLoading={isLabelsLoading}
        disabled={isMutationPending}
        onChange={onLabelsChange}
        ariaLabel={LABELS_ARIA}
      />
    </Stack>

    <Tooltip title={EDIT_TOOLTIP}>
      <span style={tooltipChildSx}>
        <IconButton
          size="small"
          onClick={onEditOpen}
          disabled={isMutationPending}
          aria-label={EDIT_ARIA}
        >
          <TuneIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>

    <Tooltip title={DELETE_TOOLTIP}>
      <span style={tooltipChildSx}>
        <IconButton
          size="small"
          onClick={onDeleteOpen}
          disabled={isMutationPending}
          aria-label={DELETE_ARIA}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  </Stack>
);
