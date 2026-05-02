import {
  type Block as PrismaBlock,
  type BlockSegment as PrismaBlockSegment,
  type ExerciseEntry as PrismaExerciseEntry,
} from "@prisma/client";

import {
  type BulkPatchConflict,
  type BulkPatchPlanInput,
  type BulkPatchPlanResponse,
} from "@repo/contracts/lms/training-plan";
import { logger } from "@repo/shared";

import { verifyPlanOwnership } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { TX_BUDGET_BULK } from "../../../db/transaction-config";
import { mapToBlock, mapToBlockSegment, mapToExerciseEntry } from "../../../mappers/lms";
import { buildExerciseSnapshotMap } from "../../../services/lms/derive-exercise-snapshot";
import { handlePrismaError } from "../../../utils";

import { applyOpInTx } from "./bulk-patch/bulk-patch-apply-op";
import { collectEntryExerciseIds, verifyOpsBelongToPlan } from "./bulk-patch/bulk-patch-helpers";

class BulkPatchRollback extends Error {
  conflicts: BulkPatchConflict[];

  constructor(conflicts: BulkPatchConflict[]) {
    super("Bulk-patch rollback");
    this.conflicts = conflicts;
    this.name = "BulkPatchRollback";
  }
}

export const lmsTrainingPlanPatchApi = {
  patch: async (
    userId: string,
    planId: string,
    data: BulkPatchPlanInput,
  ): Promise<BulkPatchPlanResponse> => {
    await verifyPlanOwnership(planId, userId);

    const startedAtMs = Date.now();

    try {
      const outcome = await prisma.$transaction(async (tx) => {
        await verifyOpsBelongToPlan(tx, planId, data.ops);

        const snapshotMap = await buildExerciseSnapshotMap(tx, collectEntryExerciseIds(data.ops));

        const conflicts: BulkPatchConflict[] = [];
        const updatedBlocks: PrismaBlock[] = [];
        const updatedSegments: PrismaBlockSegment[] = [];
        const updatedEntries: PrismaExerciseEntry[] = [];

        for (const [opIndex, op] of data.ops.entries()) {
          const result = await applyOpInTx(tx, op, snapshotMap);

          if (result.kind === "conflict") {
            conflicts.push({ opIndex, kind: op.kind, currentVersion: result.currentVersion });
            continue;
          }

          if (result.block) {
            updatedBlocks.push(result.block);
          }

          if (result.segment) {
            updatedSegments.push(result.segment);
          }

          if (result.entry) {
            updatedEntries.push(result.entry);
          }
        }

        if (conflicts.length > 0) {
          throw new BulkPatchRollback(conflicts);
        }

        return { updatedBlocks, updatedSegments, updatedEntries };
      }, TX_BUDGET_BULK);

      logger.info("lms.editor.bulk_patch_applied", {
        planId,
        opCount: data.ops.length,
        conflictCount: 0,
        durationMs: Date.now() - startedAtMs,
      });

      return {
        updated: {
          blocks: outcome.updatedBlocks.map(mapToBlock),
          segments: outcome.updatedSegments.map(mapToBlockSegment),
          entries: outcome.updatedEntries.map(mapToExerciseEntry),
        },
      };
    } catch (error) {
      if (error instanceof BulkPatchRollback) {
        logger.info("lms.editor.bulk_patch_applied", {
          planId,
          opCount: data.ops.length,
          conflictCount: error.conflicts.length,
          durationMs: Date.now() - startedAtMs,
        });

        return {
          updated: { blocks: [], segments: [], entries: [] },
          conflicts: error.conflicts,
        };
      }

      return handlePrismaError(error, { entity: "Training plan" });
    }
  },
};
