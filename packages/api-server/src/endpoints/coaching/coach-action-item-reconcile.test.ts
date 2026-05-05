import { type CoachActionItem as PrismaCoachActionItemRecord } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { type prisma } from "../../db/client";

import { closeOrphanedOpenItems, resolveDuplicates } from "./coach-action-item-reconcile";

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const mockItem = (
  overrides?: Partial<PrismaCoachActionItemRecord>,
): PrismaCoachActionItemRecord => ({
  id: "item-1",
  coachId: "coach-1",
  athleteId: "athlete-1",
  type: "MISSED_WORKOUTS",
  severity: "WARNING",
  status: "OPEN",
  message: "Sample",
  metadata: null,
  resolvedAt: null,
  resolveReason: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  ...overrides,
});

const makeTx = (): TxClient =>
  ({
    coachActionItem: { update: vi.fn(), updateMany: vi.fn() },
  }) as unknown as TxClient;

describe("resolveDuplicates (perf-004)", () => {
  it("issues a single updateMany for all duplicate ids", async () => {
    const tx = makeTx();
    const duplicates = [
      mockItem({ id: "dup-a" }),
      mockItem({ id: "dup-b" }),
      mockItem({ id: "dup-c" }),
    ];

    vi.mocked(tx.coachActionItem.updateMany).mockResolvedValue({ count: 3 });

    const result = await resolveDuplicates(tx, duplicates);

    expect(tx.coachActionItem.update).not.toHaveBeenCalled();
    expect(tx.coachActionItem.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.coachActionItem.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["dup-a", "dup-b", "dup-c"] } },
      data: expect.objectContaining({
        status: "RESOLVED",
        resolveReason: "AUTO_CONDITION_CLEARED",
      }),
    });
    expect(result).toBe(3);
  });

  it("noops when there are no duplicates", async () => {
    const tx = makeTx();

    const result = await resolveDuplicates(tx, []);

    expect(tx.coachActionItem.updateMany).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });
});

describe("closeOrphanedOpenItems (perf-004)", () => {
  it("groups by reason and issues one updateMany per reason bucket", async () => {
    const tx = makeTx();
    const openByKey = new Map<string, PrismaCoachActionItemRecord>([
      ["MISSED_WORKOUTS:athlete-1", mockItem({ id: "open-1", athleteId: "athlete-1" })],
      ["MISSED_WORKOUTS:athlete-2", mockItem({ id: "open-2", athleteId: "athlete-2" })],
      ["HEALTH_REPORT:athlete-3", mockItem({ id: "open-3", athleteId: "athlete-3" })],
    ]);
    const activeAthleteIds = new Set(["athlete-1"]);

    vi.mocked(tx.coachActionItem.updateMany).mockResolvedValue({ count: 1 });

    const result = await closeOrphanedOpenItems(tx, { openByKey, activeAthleteIds });

    expect(tx.coachActionItem.update).not.toHaveBeenCalled();
    expect(tx.coachActionItem.updateMany).toHaveBeenCalledTimes(2);
    expect(result).toBe(2);

    const calls = vi.mocked(tx.coachActionItem.updateMany).mock.calls.map((c) => c[0]) as Array<{
      where: { id: { in: string[] } };
      data: { resolveReason: string };
    }>;

    const cleared = calls.find((c) => c.data.resolveReason === "AUTO_CONDITION_CLEARED");
    const ended = calls.find((c) => c.data.resolveReason === "AUTO_ASSIGNMENT_ENDED");

    expect(cleared?.where.id.in).toEqual(["open-1"]);
    expect(ended?.where.id.in).toEqual(expect.arrayContaining(["open-2", "open-3"]));
  });

  it("noops when openByKey is empty", async () => {
    const tx = makeTx();
    const result = await closeOrphanedOpenItems(tx, {
      openByKey: new Map(),
      activeAthleteIds: new Set(),
    });

    expect(tx.coachActionItem.updateMany).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });
});
