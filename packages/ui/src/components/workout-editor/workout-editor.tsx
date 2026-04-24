"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Box, Button, Menu, MenuItem, Stack, Typography, useTheme } from "@mui/material";
import { EditorContent } from "@tiptap/react";

import { buildSlashItems } from "./build-slash-items";
import { runSlashCommand } from "./extensions/slash-command";
import type {
  ExerciseSuggestion,
  InlineExerciseDraft,
  SchemeSuggestion,
  SlashCommandItem,
  WorkoutEditorProps,
} from "./types";
import { useWorkoutEditor } from "./use-workout-editor";
import { InlineCreateExerciseDialog } from "./views";

type InlineCreateState = {
  open: boolean;
  query: string;
  submitting: boolean;
  error?: string;
  resolve: ((result: ExerciseSuggestion | null) => void) | null;
};

const INITIAL_INLINE_CREATE: InlineCreateState = {
  open: false,
  query: "",
  submitting: false,
  error: undefined,
  resolve: null,
};

export const WorkoutEditor = (props: WorkoutEditorProps) => {
  const theme = useTheme();
  const {
    value,
    onChange,
    onBlur,
    exercises,
    createExercise,
    listSchemes,
    blockTypes,
    placeholder = "Click + Add block or type / to insert",
    disabled = false,
  } = props;

  const [schemes, setSchemes] = useState<SchemeSuggestion[]>([]);
  const [inlineCreate, setInlineCreate] = useState<InlineCreateState>(INITIAL_INLINE_CREATE);
  const [addBlockAnchor, setAddBlockAnchor] = useState<HTMLElement | null>(null);
  const propsRef = useRef(props);

  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  useEffect(() => {
    let cancelled = false;

    listSchemes().then((list) => {
      if (!cancelled) {
        setSchemes(list);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [listSchemes]);

  const slashItemsFactory = useCallback(
    (query: string): SlashCommandItem[] =>
      buildSlashItems(query, { blockTypes, schemes }, propsRef.current),
    [blockTypes, schemes],
  );

  const onRequestInlineCreate = useCallback(
    (query: string): Promise<ExerciseSuggestion | null> =>
      new Promise<ExerciseSuggestion | null>((resolve) => {
        setInlineCreate({
          open: true,
          query,
          submitting: false,
          error: undefined,
          resolve,
        });
      }),
    [],
  );

  const handleInlineSubmit = useCallback(
    async (draft: InlineExerciseDraft) => {
      setInlineCreate((prev) => ({ ...prev, submitting: true, error: undefined }));

      try {
        const created = await createExercise({
          canonicalName: draft.canonicalName,
          aliases: [],
          measurementUnits: draft.measurementUnits,
          hasLoad: draft.hasLoad,
          description: draft.description,
          videoUrl: draft.videoUrl,
        });

        setInlineCreate((prev) => {
          prev.resolve?.(created);

          return INITIAL_INLINE_CREATE;
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create exercise";

        setInlineCreate((prev) => ({ ...prev, submitting: false, error: message }));
      }
    },
    [createExercise],
  );

  const handleInlineCancel = useCallback(() => {
    setInlineCreate((prev) => {
      prev.resolve?.(null);

      return INITIAL_INLINE_CREATE;
    });
  }, []);

  const { editor } = useWorkoutEditor({
    value,
    onChange,
    onBlur,
    exercises,
    createExercise,
    blockTypes,
    placeholder,
    disabled,
    slashItemsFactory,
    onRequestInlineCreate,
  });

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

  const addBlockItems = useMemo<SlashCommandItem[]>(
    () => slashItemsFactory(""),
    [slashItemsFactory],
  );

  const handleAddBlockOpen = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAddBlockAnchor(event.currentTarget);
  }, []);

  const handleAddBlockClose = useCallback(() => {
    setAddBlockAnchor(null);
  }, []);

  const handleAddBlockSelect = useCallback(
    (item: SlashCommandItem) => {
      if (editor) {
        const end = editor.state.doc.content.size;

        runSlashCommand(editor, { from: end, to: end }, item);
      }

      setAddBlockAnchor(null);
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
          <EditorContent editor={editor} />
        </Box>

        <Box sx={{ px: 2, py: 1, borderTop: 1, borderColor: "divider" }}>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddBlockOpen}
            disabled={disabled || editor === null}
          >
            Add block
          </Button>
          <Menu
            anchorEl={addBlockAnchor}
            open={addBlockAnchor !== null}
            onClose={handleAddBlockClose}
          >
            {addBlockItems.map((item) => (
              <MenuItem key={item.id} onClick={() => handleAddBlockSelect(item)}>
                <Stack>
                  <Typography variant="body2">{item.label}</Typography>
                  {item.description !== undefined && (
                    <Typography variant="caption" color="text.secondary">
                      {item.description}
                    </Typography>
                  )}
                </Stack>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>

      {editor === null && (
        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, ml: 1 }}>
          Loading editor...
        </Typography>
      )}

      <InlineCreateExerciseDialog
        open={inlineCreate.open}
        initialName={inlineCreate.query}
        submitting={inlineCreate.submitting}
        error={inlineCreate.error}
        onCancel={handleInlineCancel}
        onSubmit={(draft) => {
          void handleInlineSubmit(draft);
        }}
      />
    </Stack>
  );
};
