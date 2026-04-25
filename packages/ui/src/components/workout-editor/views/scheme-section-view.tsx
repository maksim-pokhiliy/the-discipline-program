"use client";

import { memo, useCallback, type CSSProperties } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import {
  Box,
  Chip,
  IconButton,
  MenuItem,
  Select,
  Stack,
  type SelectChangeEvent,
} from "@mui/material";
import type { Editor } from "@tiptap/core";
import {
  NodeViewContent,
  NodeViewWrapper,
  useEditorState,
  type NodeViewProps,
} from "@tiptap/react";

import { SCHEME_KIND_LABELS } from "@repo/contracts/library/scheme";
import { schemeConfigSchema } from "@repo/contracts/lms/workout-block";

import { readSchemes } from "../extensions/schemes";

import { readSchemeSectionAttrs } from "./node-view-types";
import { useSectionSortableId } from "./use-section-sortable-id";

const schemesSelector = ({ editor }: { editor: Editor }) => readSchemes(editor);

const formatSchemeConfigSummary = (config: Record<string, number>): string | null => {
  const entries = Object.entries(config);

  if (entries.length === 0) {
    return null;
  }

  return entries.map(([key, value]) => `${key}: ${value}`).join(" · ");
};

const SchemeSectionViewImpl = ({
  editor,
  node,
  selected,
  getPos,
  deleteNode,
  updateAttributes,
}: NodeViewProps) => {
  const attrs = readSchemeSectionAttrs(node.attrs);
  const schemes = useEditorState({ editor, selector: schemesSelector });
  const sortableId = useSectionSortableId(editor, getPos);

  const {
    setNodeRef,
    attributes: dndAttributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  const wrapperStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleChangeScheme = useCallback(
    (event: SelectChangeEvent) => {
      const nextId = event.target.value;
      const next = schemes.find((scheme) => scheme.id === nextId) ?? null;
      const parsedConfig = schemeConfigSchema.safeParse(next?.paramDefaults ?? {});

      updateAttributes({
        schemeId: next?.id ?? null,
        schemeKind: next?.kind ?? null,
        schemeConfig: parsedConfig.success ? parsedConfig.data : {},
      });
    },
    [schemes, updateAttributes],
  );

  const summary = formatSchemeConfigSummary(attrs.schemeConfig);
  const kindLabel = attrs.schemeKind !== null ? SCHEME_KIND_LABELS[attrs.schemeKind] : null;

  return (
    <NodeViewWrapper as="section" ref={setNodeRef} style={wrapperStyle} {...dndAttributes}>
      <Box
        sx={(theme) => ({
          my: 1,
          borderRadius: 1.25,
          border: 1,
          borderColor: selected ? "primary.main" : "divider",
          bgcolor: "background.default",
          overflow: "hidden",
          transition: theme.transitions.create(["border-color", "box-shadow"]),
          boxShadow: selected ? 1 : 0,
        })}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ px: 1.5, py: 0.75, borderBottom: 1, borderColor: "divider" }}
        >
          <IconButton
            size="small"
            aria-label="Reorder section"
            sx={{ cursor: "grab", touchAction: "none" }}
            onMouseDown={(event) => event.stopPropagation()}
            {...listeners}
          >
            <DragIndicatorIcon fontSize="small" />
          </IconButton>

          {kindLabel !== null && (
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              label={kindLabel}
              onMouseDown={(event) => event.stopPropagation()}
            />
          )}

          <Select
            size="small"
            value={attrs.schemeId ?? ""}
            onChange={handleChangeScheme}
            displayEmpty
            renderValue={(value) => {
              const selectedScheme = schemes.find((scheme) => scheme.id === value);

              return selectedScheme ? selectedScheme.name : "Select scheme";
            }}
            sx={{ minWidth: 160, "& .MuiSelect-select": { py: 0.5 } }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {schemes.map((scheme) => (
              <MenuItem key={scheme.id} value={scheme.id}>
                {scheme.name}
              </MenuItem>
            ))}
          </Select>

          {summary !== null && (
            <Chip
              size="small"
              variant="outlined"
              label={summary}
              onMouseDown={(event) => event.stopPropagation()}
            />
          )}

          {attrs.effortPct !== null && (
            <Chip
              size="small"
              variant="outlined"
              color="secondary"
              label={`${attrs.effortPct}% effort`}
              onMouseDown={(event) => event.stopPropagation()}
            />
          )}

          <Box sx={{ flexGrow: 1 }} />

          <IconButton
            size="small"
            aria-label="Delete section"
            onClick={deleteNode}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Box sx={{ px: 1.5, py: 1 }}>
          <NodeViewContent as="div" />
        </Box>
      </Box>
    </NodeViewWrapper>
  );
};

export const SchemeSectionView = memo(SchemeSectionViewImpl);
