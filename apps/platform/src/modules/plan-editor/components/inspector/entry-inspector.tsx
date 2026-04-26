"use client";

import { useCallback, useMemo } from "react";

import { Box, Button, Stack, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import {
  type ExerciseEntry,
  updateExerciseEntryInputSchema,
} from "@repo/contracts/lms/exercise-entry";
import { ExerciseEntryRow, SaveIndicator, useEditSession } from "@repo/ui";

import { platformKeys } from "@app/lib/api/keys";
import { useExercisesPageData } from "@app/lib/hooks";

import { useEntryBulkPatchUpdate } from "./use-bulk-patch-update";

const SESSION_NS = "entry";

const updateEntryBodySchema = updateExerciseEntryInputSchema.omit({ expectedVersion: true });

export type EntryInspectorProps = {
  planId: string;
  entry: ExerciseEntry;
};

const toDraft = (entry: ExerciseEntry) => ({
  order: entry.order,
  exerciseId: entry.exerciseId,
  exerciseSnapshot: entry.exerciseSnapshot,
  prescription: entry.prescription,
  alternatives: entry.alternatives,
  externalUrl: entry.externalUrl,
  notes: entry.notes,
});

type EntryDraft = ReturnType<typeof toDraft>;

const fromDraft = (entry: ExerciseEntry, draft: EntryDraft): ExerciseEntry => ({
  ...entry,
  ...draft,
});

export const EntryInspector = ({ planId, entry }: EntryInspectorProps) => {
  const queryClient = useQueryClient();
  const initial = useMemo(() => toDraft(entry), [entry]);
  const mutationKey = useMemo(() => [SESSION_NS, planId, entry.id] as const, [entry.id, planId]);
  const sessionId = useMemo(() => `${SESSION_NS}-${entry.id}`, [entry.id]);

  const performUpdate = useEntryBulkPatchUpdate(planId, entry.id);
  const exercisesQuery = useExercisesPageData({ scope: "ALL", take: 200 });
  const exerciseLibrary = useMemo(() => exercisesQuery.data?.items ?? [], [exercisesQuery.data]);

  const mutationFn = useCallback(
    async (draft: EntryDraft, expectedVersion: number): Promise<EntryDraft> => {
      const next = await performUpdate(fromDraft(entry, draft), expectedVersion);

      void queryClient.invalidateQueries({
        queryKey: platformKeys.trainingPlans.structureByPlan(planId),
      });

      return toDraft(next);
    },
    [entry, performUpdate, planId, queryClient],
  );

  const session = useEditSession<EntryDraft>({
    sessionId,
    initial,
    expectedVersion: entry.version,
    label: entry.exerciseSnapshot.name,
    mutationKey,
    mutationFn,
    validate: (draft) => updateEntryBodySchema.safeParse(draft),
  });

  const handleChange = useCallback(
    (next: ExerciseEntry | ((prev: ExerciseEntry) => ExerciseEntry)) => {
      session.dispatch((prev) => {
        const merged = typeof next === "function" ? next(fromDraft(entry, prev)) : next;

        return toDraft(merged);
      });
    },
    [entry, session],
  );

  const handleReload = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: platformKeys.trainingPlans.structureByPlan(planId),
    });
    session.reset(toDraft(entry), session.conflict?.currentVersion ?? entry.version);
  }, [entry, planId, queryClient, session]);

  const composedEntry = useMemo(() => fromDraft(entry, session.draft), [entry, session.draft]);

  return (
    <Stack data-edit-session-id={sessionId} spacing={2} sx={{ outline: "none" }} tabIndex={-1}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="subtitle1" sx={{ flex: 1 }}>
          Exercise entry
        </Typography>
        <SaveIndicator
          status={session.status}
          lastSavedAt={session.lastSavedAt}
          conflict={session.conflict}
          errorMessage={session.error?.message}
          onRetry={() => {
            void session.save();
          }}
          onReload={handleReload}
        />
      </Stack>

      <ExerciseEntryRow
        entry={composedEntry}
        mode="edit"
        exerciseLibrary={exerciseLibrary}
        onChange={handleChange}
        status={session.status}
        disabled={session.status === "saving"}
      />

      <Box>
        <Button
          variant="contained"
          size="small"
          onClick={() => {
            void session.save();
          }}
          disabled={!session.isDirty || !session.isValid || session.status === "saving"}
        >
          Save
        </Button>
      </Box>
    </Stack>
  );
};
