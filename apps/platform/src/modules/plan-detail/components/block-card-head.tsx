"use client";

import { useMemo } from "react";

import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import BoltIcon from "@mui/icons-material/Bolt";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Box, IconButton, Stack, Tooltip } from "@mui/material";

import type { Intensity } from "@repo/contracts/lms/_shared";
import { BLOCK_CONSTANTS, type Block } from "@repo/contracts/lms/block";
import type { Label } from "@repo/contracts/lms/label";
import { IndicatorChip, LabelPickerChip } from "@repo/ui";

import { useCreateLabelOption } from "@app/lib/hooks";

import { formatIntensityChips } from "../lib/format-block-meta";

const DRAG_ARIA = "Drag block";
const DELETE_ARIA = "Delete block";
const DELETE_TOOLTIP = "Delete block";
const DUPLICATE_ARIA = "Duplicate block";
const DUPLICATE_TOOLTIP = "Duplicate block";
const LABELS_ARIA = "Block labels";
const INTENSITY_ARIA = "Edit block intensity";
const INTENSITY_TOOLTIP = "Edit block intensity";

const tooltipChildSx = { display: "inline-flex" };

type BlockCardHeadProps = {
  block: Block;
  labelOptions: Label[];
  isLabelsLoading: boolean;
  isMutationPending: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  dragAttributes: DraggableAttributes;
  dragListeners: DraggableSyntheticListeners;
  onLabelsChange: (labelIds: string[]) => void;
  onDeleteOpen: () => void;
  onDuplicate?: () => void;
  intensity: Intensity | null;
  onIntensityOpen: () => void;
};

export const BlockCardHead: React.FC<BlockCardHeadProps> = ({
  block,
  labelOptions,
  isLabelsLoading,
  isMutationPending,
  isExpanded,
  onToggleExpanded,
  dragAttributes,
  dragListeners,
  onLabelsChange,
  onDeleteOpen,
  onDuplicate,
  intensity,
  onIntensityOpen,
}) => {
  const createBlockLabel = useCreateLabelOption("BLOCK");

  const intensityChips = useMemo(() => formatIntensityChips(intensity), [intensity]);

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={(theme) => ({
        px: theme.spacing(1.5),
        py: theme.spacing(1.25),
        minWidth: 0,
        ...(isExpanded && {
          borderBottom: 1,
          borderColor: "divider",
        }),
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

      <IconButton
        size="small"
        onClick={onToggleExpanded}
        aria-label={isExpanded ? "Collapse block" : "Expand block"}
      >
        <ChevronRightIcon
          fontSize="small"
          sx={(theme) => ({
            transform: isExpanded ? "rotate(90deg)" : "none",
            transition: `transform ${theme.transitions.duration.shortest}ms ${theme.transitions.easing.easeInOut}`,
          })}
        />
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
          maxCount={BLOCK_CONSTANTS.MAX_LABELS_PER_BLOCK}
          isLoading={isLabelsLoading}
          disabled={isMutationPending}
          onChange={onLabelsChange}
          onCreateOption={createBlockLabel}
          ariaLabel={LABELS_ARIA}
        />

        {intensityChips.map((chip, index) => (
          <IndicatorChip
            key={`${String(index)}-${chip.text}`}
            tone={chip.tone}
            label={chip.text}
            dot={false}
          />
        ))}
      </Stack>

      <Tooltip title={INTENSITY_TOOLTIP}>
        <Box component="span" style={tooltipChildSx}>
          <IconButton
            size="small"
            onClick={onIntensityOpen}
            disabled={isMutationPending}
            aria-label={INTENSITY_ARIA}
          >
            <BoltIcon fontSize="small" />
          </IconButton>
        </Box>
      </Tooltip>

      <Tooltip title={DUPLICATE_TOOLTIP}>
        <Box component="span" style={tooltipChildSx}>
          <IconButton
            size="small"
            onClick={onDuplicate}
            disabled={isMutationPending}
            aria-busy={isMutationPending}
            aria-label={DUPLICATE_ARIA}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Box>
      </Tooltip>

      <Tooltip title={DELETE_TOOLTIP}>
        <Box component="span" style={tooltipChildSx}>
          <IconButton
            size="small"
            onClick={onDeleteOpen}
            disabled={isMutationPending}
            aria-label={DELETE_ARIA}
            sx={{ color: "error.main" }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Tooltip>
    </Stack>
  );
};
