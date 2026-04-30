import { type BlockSegment as PrismaBlockSegment, Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@repo/errors";

import { type prisma } from "../../db/client";

import { applyOpInTx } from "./bulk-patch-apply-op";

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const mockSegment = (overrides?: Partial<PrismaBlockSegment>): PrismaBlockSegment => ({
  id: "segment-1",
  blockId: "block-1",
  order: 0,
  label: null,
  archetypeKind: "COUNT_DOWN",
  schemeParams: { kind: "COUNT_DOWN", durationSec: 600 } as Prisma.JsonValue,
  schemeTemplateId: null,
  restConfig: null,
  version: 2,
  ...overrides,
});

const FULL_SEGMENT = {
  order: 0,
  label: null,
  archetypeKind: "COUNT_DOWN" as const,
  schemeParams: { kind: "COUNT_DOWN" as const, durationSec: 600 },
  schemeTemplateId: null,
  restConfig: null,
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

describe("bulk-patch-apply-op / update-segment", () => {
  it("happy path: updateMany called with correct where/data, returns segment", async () => {
    const tx = makeTx();
    const updated = mockSegment({ label: "Warm Up", version: 2 });

    vi.mocked(tx.blockSegment.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(tx.blockSegment.findUnique).mockResolvedValue(updated);

    const result = await applyOpInTx(tx, {
      kind: "update-segment",
      segmentId: "segment-1",
      expectedVersion: 1,
      fullEntity: { ...FULL_SEGMENT, label: "Warm Up" },
    });

    expect(result.kind).toBe("ok");
    expect(tx.blockSegment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "segment-1", version: 1 },
        data: expect.objectContaining({ version: { increment: 1 } }),
      }),
    );

    if (result.kind === "ok") {
      expect(result.segment).toEqual(updated);
    }
  });

  it("null restConfig: passes Prisma.JsonNull in update data", async () => {
    const tx = makeTx();

    vi.mocked(tx.blockSegment.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(tx.blockSegment.findUnique).mockResolvedValue(mockSegment());

    await applyOpInTx(tx, {
      kind: "update-segment",
      segmentId: "segment-1",
      expectedVersion: 1,
      fullEntity: FULL_SEGMENT,
    });

    const call = vi.mocked(tx.blockSegment.updateMany).mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };

    expect(call.data.restConfig).toBe(Prisma.JsonNull);
  });

  it("conflict: returns conflict with current version when updateMany count=0", async () => {
    const tx = makeTx();

    vi.mocked(tx.blockSegment.updateMany).mockResolvedValue({ count: 0 });
    vi.mocked(tx.blockSegment.findUnique).mockResolvedValue(mockSegment({ version: 3 }));

    const result = await applyOpInTx(tx, {
      kind: "update-segment",
      segmentId: "segment-1",
      expectedVersion: 99,
      fullEntity: FULL_SEGMENT,
    });

    expect(result).toEqual({ kind: "conflict", currentVersion: 3 });
  });

  it("not-found: throws NotFoundError when segment is missing", async () => {
    const tx = makeTx();

    vi.mocked(tx.blockSegment.updateMany).mockResolvedValue({ count: 0 });
    vi.mocked(tx.blockSegment.findUnique).mockResolvedValue(null);

    await expect(
      applyOpInTx(tx, {
        kind: "update-segment",
        segmentId: "missing-id",
        expectedVersion: 1,
        fullEntity: FULL_SEGMENT,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("bulk-patch-apply-op / move-segment", () => {
  it("happy path: updateMany called with targetBlockId/targetOrder, returns segment", async () => {
    const tx = makeTx();
    const moved = mockSegment({ blockId: "block-2", order: 1, version: 2 });

    vi.mocked(tx.blockSegment.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(tx.blockSegment.findUnique).mockResolvedValue(moved);

    const result = await applyOpInTx(tx, {
      kind: "move-segment",
      segmentId: "segment-1",
      expectedVersion: 1,
      targetBlockId: "block-2",
      targetOrder: 1,
    });

    expect(tx.blockSegment.updateMany).toHaveBeenCalledWith({
      where: { id: "segment-1", version: 1 },
      data: { blockId: "block-2", order: 1, version: { increment: 1 } },
    });
    expect(result.kind).toBe("ok");

    if (result.kind === "ok") {
      expect(result.segment).toEqual(moved);
    }
  });

  it("conflict: returns conflict when version mismatch", async () => {
    const tx = makeTx();

    vi.mocked(tx.blockSegment.updateMany).mockResolvedValue({ count: 0 });
    vi.mocked(tx.blockSegment.findUnique).mockResolvedValue(mockSegment({ version: 6 }));

    const result = await applyOpInTx(tx, {
      kind: "move-segment",
      segmentId: "segment-1",
      expectedVersion: 99,
      targetBlockId: "block-2",
      targetOrder: 0,
    });

    expect(result).toEqual({ kind: "conflict", currentVersion: 6 });
  });

  it("not-found: throws NotFoundError when segment is missing", async () => {
    const tx = makeTx();

    vi.mocked(tx.blockSegment.updateMany).mockResolvedValue({ count: 0 });
    vi.mocked(tx.blockSegment.findUnique).mockResolvedValue(null);

    await expect(
      applyOpInTx(tx, {
        kind: "move-segment",
        segmentId: "missing-segment",
        expectedVersion: 1,
        targetBlockId: "b-2",
        targetOrder: 0,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
