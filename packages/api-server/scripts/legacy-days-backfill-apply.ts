import { Prisma } from "@prisma/client";

import { toInputJson } from "../src/utils";

import { type BackfillAction, type BackfillPlan, describeDay } from "./legacy-days-backfill-plan";

export type BackfillUpdate = {
  isRestDay: boolean;
  dailyProgram: Prisma.InputJsonValue | typeof Prisma.DbNull;
  contentHash: string;
  legacyRowId?: number;
};

export type BackfillWriter = {
  mobilePublishedDay: {
    updateMany: (args: {
      where: { id: string; isRestDay: null };
      data: BackfillUpdate;
    }) => Promise<{ count: number }>;
  };
};

export class BackfillConflictError extends Error {
  constructor(public readonly conflictCount: number) {
    super(
      `refusing to write: ${String(conflictCount)} conflict(s) stand. Nothing was written; the ` +
        "report lists every one.",
    );
    this.name = "BackfillConflictError";
  }
}

export class DayNoLongerEmptyError extends Error {
  constructor(public readonly day: string) {
    super(
      `refusing to write: ${day} gained content between the plan and the write, so filling it ` +
        "would overwrite a day somebody published. Nothing was written; re-run so the report " +
        "reflects the current state.",
    );
    this.name = "DayNoLongerEmptyError";
  }
}

export const updateFor = (action: BackfillAction): BackfillUpdate => ({
  isRestDay: action.content.isRestDay,
  dailyProgram:
    action.content.dailyProgram === null ? Prisma.DbNull : toInputJson(action.content.dailyProgram),
  contentHash: action.contentHash,
  ...(action.kind === "fill-from-newer-row" && { legacyRowId: action.content.legacyRowId }),
});

export const applyBackfill = async (writer: BackfillWriter, plan: BackfillPlan): Promise<void> => {
  if (plan.conflicts.length > 0) {
    throw new BackfillConflictError(plan.conflicts.length);
  }

  for (const action of plan.actions) {
    const filled = await writer.mobilePublishedDay.updateMany({
      where: { id: action.target.dayId, isRestDay: null },
      data: updateFor(action),
    });

    if (filled.count === 0) {
      throw new DayNoLongerEmptyError(describeDay(action.target));
    }
  }
};
