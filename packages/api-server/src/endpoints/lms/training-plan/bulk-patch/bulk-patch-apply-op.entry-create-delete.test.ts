import {
  type ExerciseEntry as PrismaExerciseEntry,
  type ExerciseLibraryItem as PrismaExerciseLibraryItem,
  type Prisma,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@repo/errors";

import { type prisma } from "../../../../db/client";

import { applyOpInTx } from "./bulk-patch-apply-op";

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const mockEntry = (overrides?: Partial<PrismaExerciseEntry>): PrismaExerciseEntry => ({
  id: "entry-1",
  setGroupId: "setgroup-1",
  order: 0,
  exerciseId: "exercise-1",
  exerciseSnapshot: {} as Prisma.JsonValue,
  prescription: {
    reps: { kind: "FIXED", value: 5 },
    sideMode: "BILATERAL",
    modifiers: [],
  } as Prisma.JsonValue,
  alternatives: [] as unknown as Prisma.JsonValue,
  externalUrl: null,
  notes: null,
  version: 2,
  ...overrides,
});

const mockExerciseLibraryItem = (): PrismaExerciseLibraryItem => ({
  id: "exercise-1",
  name: "Back Squat",
  nameAliases: [],
  description: null,
  scope: "SYSTEM",
  ownerId: null,
  primaryMovement: "SQUAT",
  modality: "BARBELL",
  equipment: [],
  primaryBodyParts: ["QUADS"],
  secondaryBodyParts: [],
  skillLevel: "BEGINNER",
  defaultMetrics: {
    canMeasureLoad: true,
    canMeasureReps: true,
    canMeasureDuration: false,
    canMeasureDistance: false,
    canMeasureCalories: false,
  } as Prisma.JsonValue,
  demoVideoUrl: null,
  demoImageUrl: null,
  parentId: null,
  isBenchmark: false,
  version: 1,
  supersedesId: null,
  isDeprecated: false,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  deletedAt: null,
});

const SNAPSHOT = {
  id: "exercise-1",
  name: "Back Squat",
  primaryMovement: "SQUAT" as const,
  modality: "BARBELL" as const,
  primaryBodyParts: ["QUADS" as const],
  defaultMetrics: undefined,
  demoVideoUrl: null,
  demoImageUrl: null,
};
const PRESCRIPTION = {
  kind: "STRAIGHT_SET" as const,
  sets: 3,
  repsSpec: { kind: "FIXED" as const, value: 5 },
  loadSpec: { kind: "NONE" as const },
  sideMode: "BILATERAL" as const,
  modifiers: [] as string[],
};
const PAYLOAD = {
  order: 0,
  exerciseId: "exercise-1",
  exerciseSnapshot: SNAPSHOT,
  prescription: PRESCRIPTION,
  alternatives: [],
};

const makeTx = (): TxClient =>
  ({
    block: { updateMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
    blockSegment: {
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    exerciseEntry: {
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    exerciseLibraryItem: { findUnique: vi.fn() },
  }) as unknown as TxClient;

describe("bulk-patch-apply-op / create-entry", () => {
  it("happy path: derives server snapshot, calls exerciseEntry.create, returns entry", async () => {
    const tx = makeTx();
    const created = mockEntry({ id: "new-entry", version: 1 });

    vi.mocked(tx.exerciseLibraryItem.findUnique).mockResolvedValue(mockExerciseLibraryItem());
    vi.mocked(tx.exerciseEntry.create).mockResolvedValue(created);

    const result = await applyOpInTx(tx, {
      kind: "create-entry",
      setGroupId: "setgroup-1",
      payload: PAYLOAD,
    });

    expect(tx.exerciseLibraryItem.findUnique).toHaveBeenCalledWith({ where: { id: "exercise-1" } });
    expect(tx.exerciseEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          setGroupId: "setgroup-1",
          order: 0,
          exerciseId: "exercise-1",
        }),
      }),
    );
    expect(result.kind).toBe("ok");

    if (result.kind === "ok") {
      expect(result.entry).toEqual(created);
    }
  });

  it("snapshot written to DB is derived from server library item (ADR-0030)", async () => {
    const tx = makeTx();
    const exerciseItem = mockExerciseLibraryItem();

    vi.mocked(tx.exerciseLibraryItem.findUnique).mockResolvedValue(exerciseItem);
    vi.mocked(tx.exerciseEntry.create).mockResolvedValue(mockEntry());

    await applyOpInTx(tx, { kind: "create-entry", setGroupId: "setgroup-1", payload: PAYLOAD });

    const call = vi.mocked(tx.exerciseEntry.create).mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    const snapshot = call.data.exerciseSnapshot as Record<string, unknown>;

    expect(snapshot.id).toBe(exerciseItem.id);
    expect(snapshot.name).toBe(exerciseItem.name);
    expect(snapshot.primaryMovement).toBe("SQUAT");
    expect(snapshot.modality).toBe("BARBELL");
  });

  it("not-found exercise: throws NotFoundError when exercise library item is null", async () => {
    const tx = makeTx();

    vi.mocked(tx.exerciseLibraryItem.findUnique).mockResolvedValue(null);

    await expect(
      applyOpInTx(tx, {
        kind: "create-entry",
        setGroupId: "setgroup-1",
        payload: { ...PAYLOAD, exerciseId: "nonexistent" },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("snapshotMap hit: skips exerciseLibraryItem.findUnique (perf-003)", async () => {
    const tx = makeTx();
    const cachedSnapshot = {
      id: "exercise-1",
      name: "Cached Squat",
      primaryMovement: "SQUAT" as const,
      modality: "BARBELL" as const,
      primaryBodyParts: ["QUADS" as const],
      defaultMetrics: undefined,
      demoVideoUrl: null,
      demoImageUrl: null,
    };
    const snapshotMap = new Map([["exercise-1", cachedSnapshot]]);

    vi.mocked(tx.exerciseEntry.create).mockResolvedValue(mockEntry());

    await applyOpInTx(
      tx,
      { kind: "create-entry", setGroupId: "setgroup-1", payload: PAYLOAD },
      snapshotMap,
    );

    expect(tx.exerciseLibraryItem.findUnique).not.toHaveBeenCalled();

    const call = vi.mocked(tx.exerciseEntry.create).mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    const snapshot = call.data.exerciseSnapshot as Record<string, unknown>;

    expect(snapshot.name).toBe("Cached Squat");
  });
});

describe("bulk-patch-apply-op / delete-entry", () => {
  it("happy path: exerciseEntry.deleteMany called, returns ok", async () => {
    const tx = makeTx();

    vi.mocked(tx.exerciseEntry.deleteMany).mockResolvedValue({ count: 1 });

    const result = await applyOpInTx(tx, {
      kind: "delete-entry",
      entryId: "entry-1",
      expectedVersion: 1,
    });

    expect(tx.exerciseEntry.deleteMany).toHaveBeenCalledWith({
      where: { id: "entry-1", version: 1 },
    });
    expect(result).toEqual({ kind: "ok" });
  });

  it("conflict: returns conflict when deleteMany count=0", async () => {
    const tx = makeTx();

    vi.mocked(tx.exerciseEntry.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(tx.exerciseEntry.findUnique).mockResolvedValue(mockEntry({ version: 9 }));

    const result = await applyOpInTx(tx, {
      kind: "delete-entry",
      entryId: "entry-1",
      expectedVersion: 99,
    });

    expect(result).toEqual({ kind: "conflict", currentVersion: 9 });
  });

  it("not-found: throws NotFoundError when entry is missing", async () => {
    const tx = makeTx();

    vi.mocked(tx.exerciseEntry.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(tx.exerciseEntry.findUnique).mockResolvedValue(null);

    await expect(
      applyOpInTx(tx, { kind: "delete-entry", entryId: "missing-entry", expectedVersion: 1 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
