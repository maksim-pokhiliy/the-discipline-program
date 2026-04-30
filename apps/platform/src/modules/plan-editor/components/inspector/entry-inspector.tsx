"use client";

import { useCallback, useMemo } from "react";

import { Box, Button, Stack, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { type ExerciseSnapshot } from "@repo/contracts/lms/_domain";
import {
  type ExerciseEntry,
  updateExerciseEntryInputSchema,
} from "@repo/contracts/lms/exercise-entry";
import { type ExerciseLibraryItem } from "@repo/contracts/lms/exercise-library-item";
import {
  ExerciseEntryRow,
  SaveIndicator,
  useEditSession,
  useEditSessionOrchestrator,
} from "@repo/ui";

import { platformKeys } from "@app/lib/api/keys";
import { useExercisesPageData } from "@app/lib/hooks";

import { useEditingTarget } from "../../lib/editing-target";
import { AtPicker, type AtPickerSelection, useInlineTrigger } from "../inline-picker";

import { OverrideModeChip } from "./override-mode-chip";
import { useAthleteLabel } from "./use-athlete-label";
import { useEntryBulkPatchUpdate } from "./use-bulk-patch-update";
import { useEntryOverrideUpdate } from "./use-override-update";

const buildExerciseSnapshot = (item: ExerciseLibraryItem): ExerciseSnapshot => ({
  id: item.id,
  name: item.name,
  primaryMovement: item.primaryMovement,
  modality: item.modality,
  primaryBodyParts: item.primaryBodyParts,
  defaultMetrics: item.defaultMetrics,
  demoVideoUrl: item.demoVideoUrl,
  demoImageUrl: item.demoImageUrl,
});

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
  const orchestrator = useEditSessionOrchestrator();
  const initial = useMemo(() => toDraft(entry), [entry]);
  const { target } = useEditingTarget();
  const enrollmentId = target.kind === "athlete" ? target.enrollmentId : null;
  const athleteLabel = useAthleteLabel(planId, enrollmentId ?? "");
  const mutationKey = useMemo(
    () => [SESSION_NS, planId, entry.id, enrollmentId ?? "all"] as const,
    [enrollmentId, entry.id, planId],
  );
  const sessionId = useMemo(
    () => `${SESSION_NS}-${entry.id}-${enrollmentId ?? "all"}`,
    [enrollmentId, entry.id],
  );

  const performBaseUpdate = useEntryBulkPatchUpdate(planId, entry.id);
  const performOverrideUpdate = useEntryOverrideUpdate(enrollmentId ?? "", entry.id);
  const exercisesQuery = useExercisesPageData({ scope: "ALL", take: 200 });
  const exerciseLibrary = useMemo(() => exercisesQuery.data?.items ?? [], [exercisesQuery.data]);

  const mutationFn = useCallback(
    async (draft: EntryDraft, expectedVersion: number): Promise<EntryDraft> => {
      const composed = fromDraft(entry, draft);

      if (enrollmentId) {
        await performOverrideUpdate(composed, expectedVersion);

        return draft;
      }

      const next = await performBaseUpdate(composed, expectedVersion);

      void queryClient.invalidateQueries({
        queryKey: platformKeys.trainingPlans.structureByPlan(planId),
      });

      return toDraft(next);
    },
    [enrollmentId, entry, performBaseUpdate, performOverrideUpdate, planId, queryClient],
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

  const atTrigger = useInlineTrigger({ triggers: ["@"] });

  const handleAtSelect = useCallback(
    (selection: AtPickerSelection) => {
      session.dispatch((prev) => ({
        ...prev,
        exerciseId: selection.exercise.id,
        exerciseSnapshot: buildExerciseSnapshot(selection.exercise),
      }));
      atTrigger.close();
    },
    [atTrigger, session],
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
        {enrollmentId && <OverrideModeChip athleteLabel={athleteLabel} />}
        <SaveIndicator
          status={session.status}
          lastSavedAt={session.lastSavedAt}
          conflict={session.conflict}
          errorMessage={session.error?.message}
          onRetry={() => {
            void orchestrator?.flushSession(sessionId);
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
        notesSlotProps={atTrigger.inputProps}
      />

      <AtPicker
        open={atTrigger.state?.kind === "@"}
        anchorEl={atTrigger.state?.anchorEl ?? null}
        query={atTrigger.state?.query ?? ""}
        onSelect={handleAtSelect}
        onClose={atTrigger.close}
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
