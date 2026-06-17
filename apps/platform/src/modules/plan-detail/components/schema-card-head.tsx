"use client";

import { type ReactElement } from "react";

import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import TuneIcon from "@mui/icons-material/Tune";
import { Box, Checkbox, IconButton, Stack, Tooltip } from "@mui/material";

import { type Intensity } from "@repo/contracts/lms/_shared";
import { deriveCompositionLabel } from "@repo/contracts/lms/composition";
import { type SchemaWithBody, SCHEMA_CONSTANTS } from "@repo/contracts/lms/schema";
import { InlineEditText } from "@repo/ui";

import { formatRepetitionLabel } from "../lib/format-composition-summary";

import { SchemaCardMeta } from "./schema-card-meta";
import { SchemaCompositionTag } from "./schema-composition-tag";

const DRAG_ARIA = "Drag schema";
const COLLAPSE_ARIA = "Collapse schema";
const EXPAND_ARIA = "Expand schema";
const SELECT_ARIA = "Select schema";
const DELETE_ARIA = "Delete schema";
const DELETE_TOOLTIP = "Delete schema";
const DUPLICATE_ARIA = "Duplicate schema";
const DUPLICATE_TOOLTIP = "Duplicate schema";
const EDIT_ARIA = "Edit axes";
const EDIT_TOOLTIP = "Edit axes";
const TITLE_ARIA = "Schema title";
const TITLE_PLACEHOLDER = "schema title...";
const HEAD_PX = 1.5;
const HEAD_PY = 1.25;
const HEAD_SPACING = 1.25;
const INFO_SPACING = 0.75;
const TITLE_ROW_SPACING = 1;

const tooltipChildSx = { display: "inline-flex" };

type SchemaCardHeadProps = {
  schema: SchemaWithBody;
  blockIntensity?: Intensity | null;
  isMutationPending: boolean;
  dragAttributes: DraggableAttributes;
  dragListeners: DraggableSyntheticListeners;
  onTitleCommit: (next: string) => void;
  onDeleteOpen: () => void;
  onEditOpen: () => void;
  onDuplicate?: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  isBoxed?: boolean;
  isDraggable?: boolean;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: ((schemaId: string) => void) | undefined;
};

export const SchemaCardHead: React.FC<SchemaCardHeadProps> = ({
  schema,
  blockIntensity = null,
  isMutationPending,
  dragAttributes,
  dragListeners,
  onTitleCommit,
  onDeleteOpen,
  onEditOpen,
  onDuplicate,
  isExpanded,
  onToggleExpanded,
  isDraggable = true,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
}): ReactElement => {
  const composition = schema.schema.composition;
  const compositionTag =
    composition !== null
      ? (formatRepetitionLabel(composition) ?? deriveCompositionLabel(composition).kind)
      : null;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={HEAD_SPACING}
      sx={{
        px: HEAD_PX,
        py: HEAD_PY,
        minWidth: 0,
        ...(isExpanded && { borderBottom: 1, borderColor: "divider" }),
      }}
    >
      {isSelectMode ? (
        <Checkbox
          size="small"
          checked={isSelected}
          onChange={() => onToggleSelect?.(schema.schema.id)}
          inputProps={{ "aria-label": SELECT_ARIA }}
        />
      ) : null}

      {isDraggable ? (
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
      ) : null}

      <IconButton
        size="small"
        onClick={onToggleExpanded}
        aria-label={isExpanded ? COLLAPSE_ARIA : EXPAND_ARIA}
      >
        <ChevronRightIcon
          fontSize="small"
          sx={(theme) => ({
            transform: isExpanded ? "rotate(90deg)" : "none",
            transition: `transform ${theme.transitions.duration.shortest}ms ${theme.transitions.easing.easeInOut}`,
          })}
        />
      </IconButton>

      <Stack direction="column" spacing={INFO_SPACING} sx={{ flex: 1, minWidth: 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={TITLE_ROW_SPACING}
          useFlexGap
          flexWrap="wrap"
          sx={{ minWidth: 0 }}
        >
          {compositionTag !== null ? <SchemaCompositionTag label={compositionTag} /> : null}
          <InlineEditText
            value={schema.schema.header ?? ""}
            onCommit={onTitleCommit}
            variant="h4"
            ariaLabel={TITLE_ARIA}
            emptyIsValid
            placeholder={TITLE_PLACEHOLDER}
            maxLength={SCHEMA_CONSTANTS.MAX_HEADER_LENGTH}
            sx={{ flex: 1, minWidth: 0 }}
          />
        </Stack>
        <SchemaCardMeta schema={schema} blockIntensity={blockIntensity} />
      </Stack>

      <Tooltip title={EDIT_TOOLTIP}>
        <Box component="span" style={tooltipChildSx}>
          <IconButton
            size="small"
            onClick={onEditOpen}
            disabled={isMutationPending}
            aria-label={EDIT_ARIA}
          >
            <TuneIcon fontSize="small" />
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
