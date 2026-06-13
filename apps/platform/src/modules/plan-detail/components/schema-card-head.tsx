"use client";

import { type ReactElement } from "react";

import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import TuneIcon from "@mui/icons-material/Tune";
import { IconButton, Stack, Tooltip } from "@mui/material";

import { deriveCompositionLabel } from "@repo/contracts/lms/composition";
import { type SchemaWithBody, SCHEMA_CONSTANTS } from "@repo/contracts/lms/schema";
import { InlineEditText } from "@repo/ui";

import { formatSchemaHeader } from "../lib/format-schema-header";

import { SchemaCardMeta } from "./schema-card-meta";
import { SchemaCompositionTag } from "./schema-composition-tag";

const DRAG_ARIA = "Drag schema";
const DELETE_ARIA = "Delete schema";
const DELETE_TOOLTIP = "Delete schema";
const EDIT_ARIA = "Edit axes";
const EDIT_TOOLTIP = "Edit axes";
const TITLE_ARIA = "Schema title";
const HEAD_PX = 1.5;
const HEAD_PY = 1.25;
const HEAD_SPACING = 1.25;
const INFO_SPACING = 0.75;
const TITLE_ROW_SPACING = 1;

const tooltipChildSx = { display: "inline-flex" };

type SchemaCardHeadProps = {
  schema: SchemaWithBody;
  isMutationPending: boolean;
  dragAttributes: DraggableAttributes;
  dragListeners: DraggableSyntheticListeners;
  onTitleCommit: (next: string) => void;
  onDeleteOpen: () => void;
  onEditOpen: () => void;
  isBoxed?: boolean;
  isDraggable?: boolean;
};

export const SchemaCardHead: React.FC<SchemaCardHeadProps> = ({
  schema,
  isMutationPending,
  dragAttributes,
  dragListeners,
  onTitleCommit,
  onDeleteOpen,
  onEditOpen,
  isBoxed = false,
  isDraggable = true,
}): ReactElement => {
  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      spacing={HEAD_SPACING}
      sx={{ px: HEAD_PX, py: HEAD_PY, minWidth: 0 }}
    >
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

      <Stack direction="column" spacing={INFO_SPACING} sx={{ flex: 1, minWidth: 0 }}>
        {!isBoxed ? (
          <Stack
            direction="row"
            alignItems="center"
            spacing={TITLE_ROW_SPACING}
            useFlexGap
            flexWrap="wrap"
            sx={{ minWidth: 0 }}
          >
            {schema.schema.composition !== null ? (
              <SchemaCompositionTag
                label={deriveCompositionLabel(schema.schema.composition).kind}
              />
            ) : null}
            <InlineEditText
              value={formatSchemaHeader(schema)}
              onCommit={onTitleCommit}
              variant="h4"
              ariaLabel={TITLE_ARIA}
              emptyIsValid
              maxLength={SCHEMA_CONSTANTS.MAX_HEADER_LENGTH}
              sx={{ flex: 1, minWidth: 0 }}
            />
          </Stack>
        ) : null}
        <SchemaCardMeta schema={schema} />
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
};
