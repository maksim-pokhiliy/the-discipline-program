"use client";

import { useCallback, useMemo } from "react";

import { Box, Button, Stack, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { type Block, updateBlockInputSchema } from "@repo/contracts/lms/block";
import { type BlockKind } from "@repo/contracts/lms/block-kind";
import { BlockBuilder, SaveIndicator, useEditSession, useEditSessionOrchestrator } from "@repo/ui";

import { platformKeys } from "@app/lib/api/keys";

import { useEditingTarget } from "../../lib/editing-target";
import { SlashPicker, type SlashPickerSelection, useInlineTrigger } from "../inline-picker";

import { OverrideModeChip } from "./override-mode-chip";
import { useAthleteLabel } from "./use-athlete-label";
import { useBlockBulkPatchUpdate } from "./use-bulk-patch-update";
import { useBlockOverrideUpdate } from "./use-override-update";

const SESSION_NS = "block";

const updateBlockBodySchema = updateBlockInputSchema.omit({ expectedVersion: true });

export type BlockInspectorProps = {
  planId: string;
  block: Block;
  blockKinds?: BlockKind[];
};

const toDraft = (block: Block) => ({
  order: block.order,
  kindId: block.kindId,
  title: block.title,
  status: block.status,
  weight: block.weight,
  notes: block.notes,
});

type BlockDraft = ReturnType<typeof toDraft>;

const fromDraft = (block: Block, draft: BlockDraft): Block => ({
  ...block,
  ...draft,
});

export const BlockInspector = ({ planId, block, blockKinds }: BlockInspectorProps) => {
  const queryClient = useQueryClient();
  const orchestrator = useEditSessionOrchestrator();
  const initial = useMemo(() => toDraft(block), [block]);
  const { target } = useEditingTarget();
  const enrollmentId = target.kind === "athlete" ? target.enrollmentId : null;
  const athleteLabel = useAthleteLabel(planId, enrollmentId ?? "");
  const mutationKey = useMemo(
    () => [SESSION_NS, planId, block.id, enrollmentId ?? "all"] as const,
    [block.id, enrollmentId, planId],
  );
  const sessionId = useMemo(
    () => `${SESSION_NS}-${block.id}-${enrollmentId ?? "all"}`,
    [block.id, enrollmentId],
  );

  const performBaseUpdate = useBlockBulkPatchUpdate(planId, block.id);
  const performOverrideUpdate = useBlockOverrideUpdate(enrollmentId ?? "", block.id);

  const mutationFn = useCallback(
    async (draft: BlockDraft, expectedVersion: number): Promise<BlockDraft> => {
      const composed = fromDraft(block, draft);

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
    [block, enrollmentId, performBaseUpdate, performOverrideUpdate, planId, queryClient],
  );

  const session = useEditSession<BlockDraft>({
    sessionId,
    initial,
    expectedVersion: block.version,
    label: block.title ?? "Block",
    mutationKey,
    mutationFn,
    validate: (draft) => updateBlockBodySchema.safeParse(draft),
  });

  const handleChange = useCallback(
    (next: Block | ((prev: Block) => Block)) => {
      session.dispatch((prev) => {
        const merged = typeof next === "function" ? next(fromDraft(block, prev)) : next;

        return toDraft(merged);
      });
    },
    [block, session],
  );

  const slashTrigger = useInlineTrigger({ triggers: ["/"] });

  const handleSlashSelect = useCallback(
    (selection: SlashPickerSelection) => {
      if (selection.kind === "block-kind") {
        session.dispatch((prev) => ({ ...prev, kindId: selection.blockKind.id }));
      }

      slashTrigger.close();
    },
    [session, slashTrigger],
  );

  const handleReload = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: platformKeys.trainingPlans.structureByPlan(planId),
    });
    session.reset(toDraft(block), session.conflict?.currentVersion ?? block.version);
  }, [block, planId, queryClient, session]);

  const composedBlock = useMemo(() => fromDraft(block, session.draft), [block, session.draft]);

  return (
    <Stack data-edit-session-id={sessionId} spacing={2} sx={{ outline: "none" }} tabIndex={-1}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="subtitle1" sx={{ flex: 1 }}>
          Block
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

      <BlockBuilder
        block={composedBlock}
        blockKinds={blockKinds}
        onChange={handleChange}
        status={session.status}
        disabled={session.status === "saving"}
        notesSlotProps={slashTrigger.inputProps}
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
