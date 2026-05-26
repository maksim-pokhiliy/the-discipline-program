"use client";

import { type ReactElement, type RefObject } from "react";

import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { IconButton, Stack } from "@mui/material";

import { type SchemaWithBody, SCHEMA_CONSTANTS } from "@repo/contracts/lms/schema";
import { InlineEditText } from "@repo/ui";

import { formatSchemaHeader } from "../lib/format-schema-header";

import { SchemaArchetypeTag } from "./schema-archetype-tag";

const DRAG_ARIA = "Drag schema";
const KEBAB_ARIA = "Schema actions";
const TITLE_ARIA = "Schema title";
const HEAD_PX = 1.5;
const HEAD_PY = 1.25;
const HEAD_SPACING = 1.25;
const TITLE_ROW_SPACING = 1;

type SchemaCardHeadProps = {
  schema: SchemaWithBody;
  archetypeLabel: string | null;
  isMutationPending: boolean;
  isSubSchema: boolean;
  dragAttributes: DraggableAttributes;
  dragListeners: DraggableSyntheticListeners;
  kebabAnchorRef: RefObject<HTMLButtonElement | null>;
  onTitleCommit: (next: string) => void;
  onKebabOpen: () => void;
};

export const SchemaCardHead: React.FC<SchemaCardHeadProps> = ({
  schema,
  archetypeLabel,
  isMutationPending,
  isSubSchema,
  dragAttributes,
  dragListeners,
  kebabAnchorRef,
  onTitleCommit,
  onKebabOpen,
}): ReactElement => (
  <Stack
    direction="row"
    alignItems="flex-start"
    spacing={HEAD_SPACING}
    sx={{ px: HEAD_PX, pt: HEAD_PY, minWidth: 0 }}
  >
    {!isSubSchema ? (
      <IconButton
        {...dragAttributes}
        {...dragListeners}
        size="small"
        aria-label={DRAG_ARIA}
        disabled={isMutationPending}
        sx={{ cursor: "grab", touchAction: "none" }}
      >
        <DragIndicatorIcon fontSize="small" />
      </IconButton>
    ) : null}

    <Stack
      direction="row"
      alignItems="center"
      spacing={TITLE_ROW_SPACING}
      useFlexGap
      flexWrap="wrap"
      sx={{ flex: 1, minWidth: 0 }}
    >
      <SchemaArchetypeTag label={archetypeLabel ?? schema.schema.archetypeParams.archetype} />
      <InlineEditText
        value={formatSchemaHeader(schema, archetypeLabel)}
        onCommit={onTitleCommit}
        variant="h4"
        ariaLabel={TITLE_ARIA}
        emptyIsValid
        maxLength={SCHEMA_CONSTANTS.MAX_HEADER_LENGTH}
        sx={{ flex: 1, minWidth: 0 }}
      />
    </Stack>

    {!isSubSchema ? (
      <IconButton
        ref={kebabAnchorRef}
        onClick={onKebabOpen}
        aria-label={KEBAB_ARIA}
        size="small"
        disabled={isMutationPending}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
    ) : null}
  </Stack>
);
