import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  applyBackfill,
  BackfillConflictError,
  type BackfillWriter,
  DayNoLongerEmptyError,
  updateFor,
} from "./legacy-days-backfill-apply";
import type { BackfillAction, BackfillPlan, BackfillTarget } from "./legacy-days-backfill-plan";

const PROGRAM = {
  dayTrainings: [{ trainingNumber: 1, blocks: [{ name: "WARM-UP", exercises: ["200 m row"] }] }],
};

type UpdateArgs = Parameters<BackfillWriter["mobilePublishedDay"]["updateMany"]>[0];

type Call = { path: string; args: UpdateArgs };

type ForbiddenWrites = Record<
  "update" | "create" | "createMany" | "upsert" | "delete" | "deleteMany",
  () => never
>;

const fakeWriter = (
  counts: number[] = [],
): {
  writer: BackfillWriter & { mobilePublishedDay: ForbiddenWrites };
  calls: Call[];
} => {
  const calls: Call[] = [];
  const forbid = (path: string) => (): never => {
    throw new Error(`apply reached for ${path}, which it must never do`);
  };

  return {
    writer: {
      mobilePublishedDay: {
        updateMany: (args) => {
          calls.push({ path: "day.updateMany", args });

          return Promise.resolve({ count: counts[calls.length - 1] ?? 1 });
        },
        update: forbid("day.update"),
        create: forbid("day.create"),
        createMany: forbid("day.createMany"),
        upsert: forbid("day.upsert"),
        delete: forbid("day.delete"),
        deleteMany: forbid("day.deleteMany"),
      },
    },
    calls,
  };
};

const target = (overrides: Partial<BackfillTarget> = {}): BackfillTarget => ({
  dayId: "day_1",
  planName: "Winter Cycle",
  channel: "GENERAL",
  legacyTargetId: 2,
  scheduledDate: "2026-07-01",
  legacyRowId: 11,
  ...overrides,
});

const action = (overrides: Partial<BackfillAction> = {}): BackfillAction => ({
  kind: "fill",
  target: target(),
  content: { legacyRowId: 11, isRestDay: false, dailyProgram: PROGRAM },
  contentHash: "hash-of-the-day",
  ...overrides,
});

const planOf = (overrides: Partial<BackfillPlan> = {}): BackfillPlan => ({
  actions: [action()],
  conflicts: [],
  warnings: [],
  alreadyFilled: 0,
  ...overrides,
});

const argsAt = (calls: Call[], index: number): Call["args"] => {
  const call = calls[index];

  if (call === undefined) {
    throw new Error(`no call was recorded at index ${String(index)}`);
  }

  return call.args;
};

describe("updateFor", () => {
  it("writes the content of a training day as JSON", () => {
    expect(updateFor(action())).toEqual({
      isRestDay: false,
      dailyProgram: PROGRAM,
      contentHash: "hash-of-the-day",
    });
  });

  it("writes a rest day as a database null, which is what the constraint accepts", () => {
    const update = updateFor(
      action({ content: { legacyRowId: 11, isRestDay: true, dailyProgram: null } }),
    );

    expect(update.isRestDay).toBe(true);
    expect(update.dailyProgram).toBe(Prisma.DbNull);
  });

  it("leaves the row id alone on a plain fill", () => {
    expect(Object.keys(updateFor(action()))).not.toContain("legacyRowId");
  });

  it("moves the row id when the legacy day was republished", () => {
    const update = updateFor(
      action({
        kind: "fill-from-newer-row",
        content: { legacyRowId: 12, isRestDay: false, dailyProgram: PROGRAM },
      }),
    );

    expect(update.legacyRowId).toBe(12);
  });
});

describe("applyBackfill", () => {
  it("only ever updates rows that still carry no content", async () => {
    const { writer, calls } = fakeWriter();

    await applyBackfill(writer, planOf());

    expect(calls.map((call) => call.path)).toEqual(["day.updateMany"]);
    expect(argsAt(calls, 0).where).toEqual({ id: "day_1", isRestDay: null });
  });

  it("writes nothing at all while a conflict stands", async () => {
    const { writer, calls } = fakeWriter();

    await expect(
      applyBackfill(
        writer,
        planOf({
          conflicts: [
            {
              subject: "general_programs #11",
              planName: null,
              reason: "duplicate-legacy-row-id",
              detail: "d",
            },
          ],
        }),
      ),
    ).rejects.toBeInstanceOf(BackfillConflictError);
    expect(calls).toEqual([]);
  });

  it("stops the whole run when a day gained content between the plan and the write", async () => {
    const { writer, calls } = fakeWriter([0]);

    await expect(
      applyBackfill(
        writer,
        planOf({ actions: [action(), action({ target: target({ dayId: "day_2" }) })] }),
      ),
    ).rejects.toBeInstanceOf(DayNoLongerEmptyError);
    expect(calls).toHaveLength(1);
  });

  it("names the day it refused over, and not the program on it", async () => {
    const { writer } = fakeWriter([0]);

    await expect(applyBackfill(writer, planOf())).rejects.toThrow("GENERAL level 2 · 2026-07-01");
  });

  it("writes nothing when the plan holds no action", async () => {
    const { writer, calls } = fakeWriter();

    await applyBackfill(writer, planOf({ actions: [] }));

    expect(calls).toEqual([]);
  });
});
