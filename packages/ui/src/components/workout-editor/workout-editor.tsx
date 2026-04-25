"use client";

import { useCallback, useMemo } from "react";

import { DndContext, pointerWithin } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { EditorContent, useEditorState } from "@tiptap/react";

import { runAddBlock } from "./runtime/add-block-command";
import { buildSlashItemsDoc } from "./runtime/build-slash-items-doc";
import { synthesizeBlockId } from "./runtime/node-id-utils";
import type { AddBlockSlashItem } from "./runtime/slash-items-types";
import type { WorkoutEditorProps } from "./types";
import { useInlineCreateExercise } from "./use-inline-create-exercise";
import { useWorkoutEditor } from "./use-workout-editor";
import { useWorkoutEditorDnd } from "./use-workout-editor-dnd";
import { AddBlockMenu, InlineCreateExerciseDialog } from "./views";

export const WorkoutEditor = (props: WorkoutEditorProps) => {
  const theme = useTheme();
  const {
    value,
    onChange,
    onBlur,
    exercises,
    createExercise,
    blockTypes,
    schemes,
    placeholder = "Click + Add block or type / to insert",
    disabled = false,
  } = props;

  const inlineCreate = useInlineCreateExercise(createExercise);

  const { editor } = useWorkoutEditor({
    value,
    onChange,
    onBlur,
    exercises,
    createExercise,
    blockTypes,
    schemes,
    placeholder,
    disabled,
    onRequestInlineCreate: inlineCreate.request,
  });

  const rootBlockIdsRaw = useEditorState({
    editor,
    selector: ({ editor: ctxEditor }) => {
      const ids: string[] = [];

      if (ctxEditor === null) {
        return ids;
      }

      ctxEditor.state.doc.forEach((child, _offset, index) => {
        if (child.type.name === "block") {
          ids.push(synthesizeBlockId(index));
        }
      });

      return ids;
    },
  });
  const rootBlockIds = useMemo<string[]>(() => rootBlockIdsRaw ?? [], [rootBlockIdsRaw]);
  const { sensors, handleDragEnd } = useWorkoutEditorDnd(editor, rootBlockIds);

  const containerSx = useMemo(
    () => ({
      width: "100%",
      border: 1,
      borderColor: "divider",
      borderRadius: 1.5,
      bgcolor: "background.paper",
      transition: theme.transitions.create("border-color"),
      "&:focus-within": {
        borderColor: "primary.main",
      },
    }),
    [theme],
  );

  const addBlockItems = useMemo<AddBlockSlashItem[]>(
    () =>
      buildSlashItemsDoc("", blockTypes).filter(
        (item): item is AddBlockSlashItem => item.kind === "add-block",
      ),
    [blockTypes],
  );

  const handleAddBlockSelect = useCallback(
    (item: AddBlockSlashItem) => {
      if (editor !== null) {
        runAddBlock(editor, item);
      }
    },
    [editor],
  );

  return (
    <Stack sx={{ width: "100%" }}>
      <Box sx={containerSx}>
        <Box
          sx={{
            p: 2,
            minHeight: 180,
            cursor: disabled ? "default" : "text",
            opacity: disabled ? 0.6 : 1,
            "& .ProseMirror": {
              outline: "none",
              minHeight: 160,
            },
            "& .ProseMirror:empty::before, & .ProseMirror .is-editor-empty::before": {
              content: "attr(data-placeholder)",
              color: "text.disabled",
              pointerEvents: "none",
            },
          }}
          onClick={() => {
            if (editor && !editor.isFocused && !disabled) {
              editor.chain().focus().run();
            }
          }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={rootBlockIds} strategy={verticalListSortingStrategy}>
              <EditorContent editor={editor} />
            </SortableContext>
          </DndContext>
        </Box>

        <Box sx={{ px: 2, py: 1, borderTop: 1, borderColor: "divider" }}>
          <AddBlockMenu
            items={addBlockItems}
            disabled={disabled || editor === null}
            onSelect={handleAddBlockSelect}
          />
        </Box>
      </Box>

      {editor === null && (
        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, ml: 1 }}>
          Loading editor...
        </Typography>
      )}

      <InlineCreateExerciseDialog
        open={inlineCreate.state.open}
        initialName={inlineCreate.state.query}
        submitting={inlineCreate.state.submitting}
        error={inlineCreate.state.error}
        onCancel={inlineCreate.cancel}
        onSubmit={(draft) => {
          void inlineCreate.submit(draft);
        }}
      />
    </Stack>
  );
};
