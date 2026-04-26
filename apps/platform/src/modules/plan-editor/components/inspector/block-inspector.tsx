"use client";

import { useCallback, useMemo } from "react";

import { Box, Button, Stack, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { type Block, updateBlockInputSchema } from "@repo/contracts/lms/block";
import { type BlockKind } from "@repo/contracts/lms/block-kind";
import { BlockBuilder, SaveIndicator, useEditSession } from "@repo/ui";

import { platformKeys } from "@app/lib/api/keys";

import { useBlockBulkPatchUpdate } from "./use-bulk-patch-update";

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
  const initial = useMemo(() => toDraft(block), [block]);
  const mutationKey = useMemo(() => [SESSION_NS, planId, block.id] as const, [block.id, planId]);
  const sessionId = useMemo(() => `${SESSION_NS}-${block.id}`, [block.id]);

  const performUpdate = useBlockBulkPatchUpdate(planId, block.id);

  const mutationFn = useCallback(
    async (draft: BlockDraft, expectedVersion: number): Promise<BlockDraft> => {
      const next = await performUpdate(fromDraft(block, draft), expectedVersion);

      void queryClient.invalidateQueries({
        queryKey: platformKeys.trainingPlans.structureByPlan(planId),
      });

      return toDraft(next);
    },
    [block, performUpdate, planId, queryClient],
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

      <BlockBuilder
        block={composedBlock}
        blockKinds={blockKinds}
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
