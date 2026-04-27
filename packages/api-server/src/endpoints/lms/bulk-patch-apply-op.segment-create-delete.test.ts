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

describe("bulk-patch-apply-op / create-segment", () => {
  it("happy path: blockSegment.create called with correct data, returns segment", async () => {
    const tx = makeTx();
    const created = mockSegment({ id: "new-segment", version: 1 });

    vi.mocked(tx.blockSegment.create).mockResolvedValue(created);

    const result = await applyOpInTx(tx, {
      kind: "create-segment",
      blockId: "block-1",
      payload: {
        order: 0,
        archetypeKind: "COUNT_DOWN",
        schemeParams: { kind: "COUNT_DOWN", durationSec: 600 },
      },
    });

    expect(tx.blockSegment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          blockId: "block-1",
          order: 0,
          archetypeKind: "COUNT_DOWN",
        }),
      }),
    );
    expect(result.kind).toBe("ok");

    if (result.kind === "ok") {
      expect(result.segment).toEqual(created);
    }
  });

  it("undefined restConfig in payload: passes Prisma.JsonNull to DB", async () => {
    const tx = makeTx();

    vi.mocked(tx.blockSegment.create).mockResolvedValue(mockSegment());

    await applyOpInTx(tx, {
      kind: "create-segment",
      blockId: "block-1",
      payload: {
        order: 0,
        archetypeKind: "COUNT_DOWN",
        schemeParams: { kind: "COUNT_DOWN", durationSec: 600 },
      },
    });

    const call = vi.mocked(tx.blockSegment.create).mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };

    expect(call.data.restConfig).toBe(Prisma.JsonNull);
  });

  it("provided restConfig: passes value as JSON input", async () => {
    const tx = makeTx();

    vi.mocked(tx.blockSegment.create).mockResolvedValue(mockSegment());

    const restConfig = { kind: "FIXED" as const, seconds: 60 };

    await applyOpInTx(tx, {
      kind: "create-segment",
      blockId: "block-1",
      payload: {
        order: 0,
        archetypeKind: "COUNT_DOWN",
        schemeParams: { kind: "COUNT_DOWN", durationSec: 600 },
        restConfig,
      },
    });

    const call = vi.mocked(tx.blockSegment.create).mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };

    expect(call.data.restConfig).toEqual(restConfig);
  });
});

describe("bulk-patch-apply-op / delete-segment", () => {
  it("happy path: blockSegment.deleteMany called, returns ok", async () => {
    const tx = makeTx();

    vi.mocked(tx.blockSegment.deleteMany).mockResolvedValue({ count: 1 });

    const result = await applyOpInTx(tx, {
      kind: "delete-segment",
      segmentId: "segment-1",
      expectedVersion: 1,
    });

    expect(tx.blockSegment.deleteMany).toHaveBeenCalledWith({
      where: { id: "segment-1", version: 1 },
    });
    expect(result).toEqual({ kind: "ok" });
  });

  it("conflict: returns conflict when deleteMany count=0", async () => {
    const tx = makeTx();

    vi.mocked(tx.blockSegment.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(tx.blockSegment.findUnique).mockResolvedValue(mockSegment({ version: 5 }));

    const result = await applyOpInTx(tx, {
      kind: "delete-segment",
      segmentId: "segment-1",
      expectedVersion: 99,
    });

    expect(result).toEqual({ kind: "conflict", currentVersion: 5 });
  });

  it("not-found: throws NotFoundError when segment is missing", async () => {
    const tx = makeTx();

    vi.mocked(tx.blockSegment.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(tx.blockSegment.findUnique).mockResolvedValue(null);

    await expect(
      applyOpInTx(tx, { kind: "delete-segment", segmentId: "missing-segment", expectedVersion: 1 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
