"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Box, Stack, Typography, useTheme } from "@mui/material";
import { EditorContent } from "@tiptap/react";

import type { BlockType } from "@repo/contracts/library/block-type";

import { BLOCK_COMMAND_DESCRIPTIONS, BLOCK_COMMAND_LABELS } from "./constants";
import type {
  ExerciseSuggestion,
  InlineExerciseDraft,
  SchemeSuggestion,
  SlashCommandItem,
  WorkoutEditorProps,
} from "./types";
import { useWorkoutEditor } from "./use-workout-editor";
import { InlineCreateExerciseDialog } from "./views";

type SlashContext = {
  blockTypes: ReadonlyArray<BlockType>;
  schemes: SchemeSuggestion[];
};

const NOTES_SLUG = "notes";
const TEXT_CALLOUT_SLUG = "text-callout";

const pickDefaultBlockTypeId = (
  blockName: string,
  blockTypes: ReadonlyArray<BlockType>,
): string | null => {
  if (blockName === "notes") {
    return blockTypes.find((bt) => bt.slug === NOTES_SLUG)?.id ?? null;
  }

  if (blockName === "textCallout") {
    return blockTypes.find((bt) => bt.slug === TEXT_CALLOUT_SLUG)?.id ?? null;
  }

  return blockTypes[0]?.id ?? null;
};

const buildSlashItems = (
  query: string,
  ctx: SlashContext,
  props: WorkoutEditorProps,
): SlashCommandItem[] => {
  const normalized = query.trim().toLowerCase();
  const blockTypes = ctx.blockTypes;
  const schemes = ctx.schemes;
  const items: SlashCommandItem[] = [];

  const blockNames = Object.keys(BLOCK_COMMAND_LABELS) as Array<keyof typeof BLOCK_COMMAND_LABELS>;

  blockNames.forEach((blockName) => {
    const label = BLOCK_COMMAND_LABELS[blockName];
    const description = BLOCK_COMMAND_DESCRIPTIONS[blockName];

    if (normalized.length > 0 && !label.toLowerCase().includes(normalized)) {
      return;
    }

    const defaultBlockTypeId = pickDefaultBlockTypeId(blockName, blockTypes);

    const matchingScheme = schemes.find((scheme) => {
      if (blockName === "straightSets") {
        return scheme.kind === "STRAIGHT_SETS";
      }

      if (blockName === "forTime") {
        return scheme.kind === "FOR_TIME";
      }

      if (blockName === "amrap") {
        return scheme.kind === "AMRAP";
      }

      if (blockName === "emom") {
        return scheme.kind === "EMOM";
      }

      if (blockName === "everyXMin") {
        return scheme.kind === "EVERY_X_MIN";
      }

      if (blockName === "intervals") {
        return scheme.kind === "INTERVALS";
      }

      if (blockName === "timeBlocks") {
        return scheme.kind === "TIME_BLOCKS";
      }

      return false;
    });

    items.push({
      id: `block-${blockName}`,
      kind: blockName,
      label,
      description,
      blockNodeName: blockName,
      blockTypeId: defaultBlockTypeId ?? undefined,
      schemeId: matchingScheme?.id ?? null,
      schemeKind: matchingScheme?.kind ?? null,
      schemeConfig: matchingScheme?.paramDefaults ?? {},
    });
  });

  const blockTemplates = props.savedBlockTemplates ?? [];

  blockTemplates.forEach((tpl) => {
    if (normalized.length > 0 && !tpl.label.toLowerCase().includes(normalized)) {
      return;
    }

    items.push({
      id: `block-tpl-${tpl.id}`,
      kind: "blockTemplate",
      label: tpl.label,
      description: tpl.description,
      templateDoc: tpl.doc,
    });
  });

  const workoutTemplates = props.savedWorkoutTemplates ?? [];

  workoutTemplates.forEach((tpl) => {
    if (normalized.length > 0 && !tpl.label.toLowerCase().includes(normalized)) {
      return;
    }

    items.push({
      id: `workout-tpl-${tpl.id}`,
      kind: "workoutTemplate",
      label: tpl.label,
      description: tpl.description,
      templateDoc: tpl.doc,
    });
  });

  return items;
};

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
    placeholder = "Type / to insert a block, @ to reference an exercise",
    disabled = false,
  } = props;

  const [schemes, setSchemes] = useState<SchemeSuggestion[]>([]);
  const [inlineCreate, setInlineCreate] = useState<InlineCreateState>(INITIAL_INLINE_CREATE);
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
