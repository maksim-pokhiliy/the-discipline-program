import {
  type Block as PrismaBlock,
  type BlockSegment as PrismaBlockSegment,
  type ExerciseEntry as PrismaExerciseEntry,
  type ExerciseLibraryItem as PrismaExerciseLibraryItem,
  type Prisma,
  type SetGroup as PrismaSetGroup,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@repo/errors";

import { type prisma } from "../../db/client";

import { applyOpInTx } from "./bulk-patch-apply-op";

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

type SourceTree = PrismaBlock & {
  segments: Array<
    PrismaBlockSegment & {
      setGroups: Array<PrismaSetGroup & { entries: PrismaExerciseEntry[] }>;
    }
  >;
};

const mockBlock = (overrides?: Partial<PrismaBlock>): PrismaBlock => ({
  id: "block-source",
  sessionId: "session-source",
  order: 0,
  kindId: "kind-1",
  title: "Strength",
  status: "ACTIVE",
  weight: 1,
  notes: null,
  version: 1,
  ...overrides,
});

const mockSegment = (overrides?: Partial<PrismaBlockSegment>): PrismaBlockSegment => ({
  id: "segment-1",
  blockId: "block-source",
  order: 0,
  label: null,
  archetypeKind: "NONE",
  schemeParams: { sets: 3 } as Prisma.JsonValue,
  schemeTemplateId: null,
  restConfig: null,
  version: 1,
  ...overrides,
});

const mockSetGroup = (overrides?: Partial<PrismaSetGroup>): PrismaSetGroup => ({
  id: "sg-1",
  segmentId: "segment-1",
  order: 0,
  label: null,
  restConfig: null,
  ...overrides,
});

const mockEntry = (overrides?: Partial<PrismaExerciseEntry>): PrismaExerciseEntry => ({
  id: "entry-1",
  setGroupId: "sg-1",
  order: 0,
  exerciseId: "exercise-1",
  exerciseSnapshot: { name: "Squat" } as Prisma.JsonValue,
  prescription: { kind: "STRAIGHT_SET" } as Prisma.JsonValue,
  alternatives: [] as unknown as Prisma.JsonValue,
  externalUrl: null,
  notes: null,
  version: 1,
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

const makeTx = (): TxClient =>
  ({
    block: { findUnique: vi.fn(), create: vi.fn() },
    blockSegment: { create: vi.fn() },
    setGroup: { create: vi.fn() },
    exerciseEntry: { create: vi.fn() },
    exerciseLibraryItem: { findUnique: vi.fn() },
  }) as unknown as TxClient;

const buildSourceTree = (overrides?: Partial<SourceTree>): SourceTree => ({
  ...mockBlock(),
  segments: [
    {
      ...mockSegment({ id: "seg-a", order: 0 }),
      setGroups: [
        {
          ...mockSetGroup({ id: "sg-a1", segmentId: "seg-a", order: 0 }),
          entries: [
            mockEntry({ id: "e-a1-1", setGroupId: "sg-a1", order: 0 }),
            mockEntry({ id: "e-a1-2", setGroupId: "sg-a1", order: 1 }),
          ],
        },
        {
          ...mockSetGroup({ id: "sg-a2", segmentId: "seg-a", order: 1 }),
          entries: [mockEntry({ id: "e-a2-1", setGroupId: "sg-a2", order: 0 })],
        },
        {
          ...mockSetGroup({ id: "sg-a3", segmentId: "seg-a", order: 2 }),
          entries: [mockEntry({ id: "e-a3-1", setGroupId: "sg-a3", order: 0 })],
        },
      ],
    },
    {
      ...mockSegment({ id: "seg-b", order: 1 }),
      setGroups: [
        {
          ...mockSetGroup({ id: "sg-b1", segmentId: "seg-b", order: 0 }),
          entries: [mockEntry({ id: "e-b1-1", setGroupId: "sg-b1", order: 0 })],
        },
        {
          ...mockSetGroup({ id: "sg-b2", segmentId: "seg-b", order: 1 }),
          entries: [],
        },
        {
          ...mockSetGroup({ id: "sg-b3", segmentId: "seg-b", order: 2 }),
          entries: [],
        },
      ],
    },
  ],
  ...overrides,
});

describe("bulk-patch-apply-op / clone-block-subtree", () => {
  it("happy path: clones block + segments + setGroups + entries with target session/order", async () => {
    const tx = makeTx();
    const source = buildSourceTree();
    const cloned = mockBlock({ id: "block-cloned", sessionId: "session-target", order: 5 });

    vi.mocked(tx.block.findUnique)
      .mockResolvedValueOnce(source as unknown as PrismaBlock)
      .mockResolvedValue(cloned);
    vi.mocked(tx.block.create).mockResolvedValue(cloned);
    vi.mocked(tx.blockSegment.create).mockResolvedValue(mockSegment({ id: "cloned-seg" }));
    vi.mocked(tx.setGroup.create).mockResolvedValue(mockSetGroup({ id: "cloned-sg" }));
    vi.mocked(tx.exerciseLibraryItem.findUnique).mockResolvedValue(mockExerciseLibraryItem());
    vi.mocked(tx.exerciseEntry.create).mockResolvedValue(mockEntry({ id: "cloned-entry" }));

    const result = await applyOpInTx(tx, {
      kind: "clone-block-subtree",
      sourceBlockId: "block-source",
      targetSessionId: "session-target",
      targetOrder: 5,
    });

    expect(tx.block.create).toHaveBeenCalledTimes(1);
    expect(tx.block.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sessionId: "session-target",
          order: 5,
          kindId: "kind-1",
          version: 1,
        }),
      }),
    );

    expect(tx.blockSegment.create).toHaveBeenCalledTimes(2);
    expect(tx.setGroup.create).toHaveBeenCalledTimes(6);
    expect(tx.exerciseEntry.create).toHaveBeenCalledTimes(5);

    expect(result.kind).toBe("ok");

    if (result.kind === "ok") {
      expect(result.block?.id).toBe("block-cloned");
    }
  });

  it("derives server snapshot from library item when cloning entries", async () => {
    const tx = makeTx();
    const source: SourceTree = {
      ...mockBlock(),
      segments: [
        {
          ...mockSegment(),
          setGroups: [
            {
              ...mockSetGroup(),
              entries: [mockEntry()],
            },
          ],
        },
      ],
    };

    vi.mocked(tx.block.findUnique).mockResolvedValue(source as unknown as PrismaBlock);
    vi.mocked(tx.block.create).mockResolvedValue(mockBlock({ id: "cloned" }));
    vi.mocked(tx.blockSegment.create).mockResolvedValue(mockSegment({ id: "cloned-seg" }));
    vi.mocked(tx.setGroup.create).mockResolvedValue(mockSetGroup({ id: "cloned-sg" }));
    vi.mocked(tx.exerciseLibraryItem.findUnique).mockResolvedValue(mockExerciseLibraryItem());
    vi.mocked(tx.exerciseEntry.create).mockResolvedValue(mockEntry({ id: "cloned-entry" }));

    await applyOpInTx(tx, {
      kind: "clone-block-subtree",
      sourceBlockId: "block-source",
      targetSessionId: "session-target",
      targetOrder: 0,
    });

    const entryCall = vi.mocked(tx.exerciseEntry.create).mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    const snapshot = entryCall.data.exerciseSnapshot as Record<string, unknown>;

    expect(snapshot.id).toBe("exercise-1");
    expect(snapshot.name).toBe("Back Squat");
    expect(snapshot.primaryMovement).toBe("SQUAT");
  });

  it("not-found: throws NotFoundError when source block is missing", async () => {
    const tx = makeTx();

    vi.mocked(tx.block.findUnique).mockResolvedValue(null);

    await expect(
      applyOpInTx(tx, {
        kind: "clone-block-subtree",
        sourceBlockId: "missing-block",
        targetSessionId: "session-target",
        targetOrder: 0,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
