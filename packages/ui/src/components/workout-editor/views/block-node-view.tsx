"use client";

import { memo, useCallback, useId, useMemo, useState, type CSSProperties } from "react";

import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Select,
  Stack,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import type { Editor } from "@tiptap/core";
import {
  NodeViewContent,
  NodeViewWrapper,
  useEditorState,
  type NodeViewProps,
} from "@tiptap/react";

import { readBlockTypes } from "../extensions/block-types";
import { readSchemes } from "../extensions/schemes";
import { runAddSection } from "../runtime/add-section-command";
import { buildSlashItemsBlock } from "../runtime/build-slash-items-block";
import { synthesizeBlockId, synthesizeSectionId } from "../runtime/node-id-utils";
import type { SlashCommandItem } from "../runtime/slash-items-types";

import { readBlockWrapperAttrs } from "./node-view-types";

const blockTypesSelector = ({ editor }: { editor: Editor }) => readBlockTypes(editor);
const schemesSelector = ({ editor }: { editor: Editor }) => readSchemes(editor);

const BlockNodeViewImpl = ({
  editor,
  node,
  selected,
  getPos,
  deleteNode,
  updateAttributes,
}: NodeViewProps) => {
  const attrs = readBlockWrapperAttrs(node.attrs);
  const blockTypes = useEditorState({ editor, selector: blockTypesSelector });
  const schemes = useEditorState({ editor, selector: schemesSelector });
  const blockIndexSelector = useCallback(
    ({ editor: ctxEditor }: { editor: Editor }) => {
      const pos = typeof getPos === "function" ? getPos() : undefined;

      if (pos === undefined) {
        return null;
      }

      try {
        return ctxEditor.state.doc.resolve(pos).index(0);
      } catch {
        return null;
      }
    },
    [getPos],
  );
  const blockIndex = useEditorState({ editor, selector: blockIndexSelector });
  const fallbackId = useId();
  const [addAnchor, setAddAnchor] = useState<HTMLElement | null>(null);

  const sortableId =
    blockIndex !== null ? synthesizeBlockId(blockIndex) : `block:invalid:${fallbackId}`;
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

  const sectionIds = useMemo<string[]>(() => {
    if (blockIndex === null) {
      return [];
    }

    const ids: string[] = [];

    for (let idx = 0; idx < node.childCount; idx += 1) {
      ids.push(synthesizeSectionId(blockIndex, idx));
    }

    return ids;
  }, [blockIndex, node]);

  const handleChangeType = useCallback(
    (event: SelectChangeEvent) => {
      updateAttributes({ blockTypeId: event.target.value });
    },
    [updateAttributes],
  );

  const handleOpenAdd = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAddAnchor(event.currentTarget);
  }, []);

  const handleCloseAdd = useCallback(() => {
    setAddAnchor(null);
  }, []);

  const handlePickSection = useCallback(
    (item: SlashCommandItem) => {
      const blockPos = typeof getPos === "function" ? getPos() : undefined;

      if (blockPos === undefined) {
        return;
      }

      runAddSection(editor, blockPos, item);
      setAddAnchor(null);
    },
    [editor, getPos],
  );

  const addSectionItems = useMemo(() => buildSlashItemsBlock("", schemes), [schemes]);

  return (
    <NodeViewWrapper as="section" ref={setNodeRef} style={wrapperStyle} {...dndAttributes}>
      <Box
        sx={(theme) => ({
          my: 1.5,
          borderRadius: 1.5,
          border: 1,
          borderColor: selected ? "primary.main" : "divider",
          bgcolor: "background.paper",
          overflow: "hidden",
          transition: theme.transitions.create(["border-color", "box-shadow"]),
          boxShadow: selected ? 2 : 0,
        })}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: "divider", bgcolor: "action.hover" }}
        >
          <IconButton
            size="small"
            aria-label="Reorder block"
            sx={{ cursor: "grab", touchAction: "none" }}
            onMouseDown={(event) => event.stopPropagation()}
            {...listeners}
          >
            <DragIndicatorIcon fontSize="small" />
          </IconButton>

          <Select
            size="small"
            value={attrs.blockTypeId ?? ""}
            onChange={handleChangeType}
            displayEmpty
            renderValue={(value) => {
              const selectedBlockType = blockTypes.find((bt) => bt.id === value);

              return selectedBlockType ? selectedBlockType.name : "Select type";
            }}
            sx={{ minWidth: 160, "& .MuiSelect-select": { py: 0.5 } }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {blockTypes.map((bt) => (
              <MenuItem key={bt.id} value={bt.id}>
                {bt.name}
              </MenuItem>
            ))}
          </Select>

          {attrs.title !== null && attrs.title.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {attrs.title}
            </Typography>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <IconButton
            size="small"
            aria-label="Delete block"
            onClick={deleteNode}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>

        <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
          <Box sx={{ px: 1.5, py: 1 }}>
            <NodeViewContent as="div" />
          </Box>
        </SortableContext>

        <Box sx={{ px: 1.5, py: 0.75, borderTop: 1, borderColor: "divider" }}>
          <Button
            size="small"
            startIcon={<AddIcon />}
            aria-label="Add section"
            onClick={handleOpenAdd}
            onMouseDown={(event) => event.stopPropagation()}
          >
            Add section
          </Button>
          <Menu anchorEl={addAnchor} open={addAnchor !== null} onClose={handleCloseAdd}>
            {addSectionItems.map((item) => (
              <MenuItem
                key={item.id}
                onClick={() => handlePickSection(item)}
                onMouseDown={(event) => event.stopPropagation()}
              >
                {item.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>
    </NodeViewWrapper>
  );
};

export const BlockNodeView = memo(BlockNodeViewImpl);
