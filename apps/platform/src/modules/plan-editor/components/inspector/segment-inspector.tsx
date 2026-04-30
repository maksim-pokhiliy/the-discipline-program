"use client";

import { useCallback, useMemo } from "react";

import { Box, Button, Stack, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import {
  type BlockSegment,
  updateBlockSegmentInputSchema,
} from "@repo/contracts/lms/block-segment";
import {
  BlockSegmentEditor,
  SaveIndicator,
  useEditSession,
  useEditSessionOrchestrator,
} from "@repo/ui";

import { platformKeys } from "@app/lib/api/keys";

import { useEditingTarget } from "../../lib/editing-target";
import { SlashPicker, type SlashPickerSelection, useInlineTrigger } from "../inline-picker";

import { OverrideModeChip } from "./override-mode-chip";
import { useAthleteLabel } from "./use-athlete-label";
import { useSegmentBulkPatchUpdate } from "./use-bulk-patch-update";
import { useSegmentOverrideUpdate } from "./use-override-update";

const SESSION_NS = "segment";

const updateSegmentBodySchema = updateBlockSegmentInputSchema.omit({ expectedVersion: true });

export type SegmentInspectorProps = {
  planId: string;
  segment: BlockSegment;
};

const buildSessionId = (segmentId: string, enrollmentId: string | null) =>
  `${SESSION_NS}-${segmentId}-${enrollmentId ?? "all"}`;

const toDraft = (segment: BlockSegment) => ({
  order: segment.order,
  label: segment.label,
  archetypeKind: segment.archetypeKind,
  schemeParams: segment.schemeParams,
  schemeTemplateId: segment.schemeTemplateId,
  restConfig: segment.restConfig,
});

type SegmentDraft = ReturnType<typeof toDraft>;

const fromDraft = (segment: BlockSegment, draft: SegmentDraft): BlockSegment => ({
  ...segment,
  ...draft,
});

export const SegmentInspector = ({ planId, segment }: SegmentInspectorProps) => {
  const queryClient = useQueryClient();
  const orchestrator = useEditSessionOrchestrator();
  const initial = useMemo(() => toDraft(segment), [segment]);
  const { target } = useEditingTarget();
  const enrollmentId = target.kind === "athlete" ? target.enrollmentId : null;
  const athleteLabel = useAthleteLabel(planId, enrollmentId ?? "");
  const mutationKey = useMemo(
    () => [SESSION_NS, planId, segment.id, enrollmentId ?? "all"] as const,
    [enrollmentId, planId, segment.id],
  );
  const sessionId = useMemo(
    () => buildSessionId(segment.id, enrollmentId),
    [enrollmentId, segment.id],
  );

  const performBaseUpdate = useSegmentBulkPatchUpdate(planId, segment.id);
  const performOverrideUpdate = useSegmentOverrideUpdate(enrollmentId ?? "", segment.id);

  const mutationFn = useCallback(
    async (draft: SegmentDraft, expectedVersion: number): Promise<SegmentDraft> => {
      const composed = fromDraft(segment, draft);

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
    [enrollmentId, performBaseUpdate, performOverrideUpdate, planId, queryClient, segment],
  );

  const session = useEditSession<SegmentDraft>({
    sessionId,
    initial,
    expectedVersion: segment.version,
    label: segment.label ?? "Segment",
    mutationKey,
    mutationFn,
    validate: (draft) => updateSegmentBodySchema.safeParse(draft),
  });

  const handleChange = useCallback(
    (next: BlockSegment | ((prev: BlockSegment) => BlockSegment)) => {
      session.dispatch((prev) => {
        const merged = typeof next === "function" ? next(fromDraft(segment, prev)) : next;

        return toDraft(merged);
      });
    },
    [segment, session],
  );

  const slashTrigger = useInlineTrigger({ triggers: ["/"] });

  const handleSlashSelect = useCallback(
    (selection: SlashPickerSelection) => {
      if (selection.kind === "scheme-template") {
        session.dispatch((prev) => ({
          ...prev,
          archetypeKind: selection.template.archetypeKind,
          schemeParams: selection.template.defaultParams,
          schemeTemplateId: selection.template.id,
          label: prev.label ?? selection.template.name,
        }));
      } else {
        session.dispatch((prev) => ({
          ...prev,
          label: selection.blockKind.name,
        }));
      }

      slashTrigger.close();
    },
    [session, slashTrigger],
  );

  const handleReload = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: platformKeys.trainingPlans.structureByPlan(planId),
    });
    session.reset(toDraft(segment), session.conflict?.currentVersion ?? segment.version);
  }, [planId, queryClient, segment, session]);

  const composedSegment = useMemo(
    () => fromDraft(segment, session.draft),
    [segment, session.draft],
  );

  return (
    <Stack data-edit-session-id={sessionId} spacing={2} sx={{ outline: "none" }} tabIndex={-1}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="subtitle1" sx={{ flex: 1 }}>
          Segment
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

      <BlockSegmentEditor
        segment={composedSegment}
        onChange={handleChange}
        status={session.status}
        disabled={session.status === "saving"}
        labelSlotProps={slashTrigger.inputProps}
      />

      <SlashPicker
        open={slashTrigger.state?.kind === "/"}
        anchorEl={slashTrigger.state?.anchorEl ?? null}
        query={slashTrigger.state?.query ?? ""}
        onSelect={handleSlashSelect}
        onClose={slashTrigger.close}
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
