import { type Block as PrismaBlock } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@repo/errors";

import { type prisma } from "../../db/client";

import { applyOpInTx } from "./bulk-patch-apply-op";

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const mockBlock = (overrides?: Partial<PrismaBlock>): PrismaBlock => ({
  id: "block-1",
  sessionId: "session-1",
  order: 0,
  kindId: "kind-1",
  title: null,
  status: "ACTIVE",
  weight: 1,
  notes: null,
  version: 2,
  ...overrides,
});

const FULL_BLOCK = {
  order: 0,
  kindId: "kind-1",
  title: null,
  status: "ACTIVE" as const,
  weight: 1,
  notes: null,
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

describe("bulk-patch-apply-op / update-block", () => {
  it("happy path: updateMany called with correct where/data, returns block", async () => {
    const tx = makeTx();
    const updated = mockBlock({ title: "New Title", version: 2 });

    vi.mocked(tx.block.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(tx.block.findUnique).mockResolvedValue(updated);

    const result = await applyOpInTx(tx, {
      kind: "update-block",
      blockId: "block-1",
      expectedVersion: 1,
      fullEntity: { ...FULL_BLOCK, title: "New Title" },
    });

    expect(result.kind).toBe("ok");
    expect(tx.block.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "block-1", version: 1 },
        data: expect.objectContaining({ version: { increment: 1 } }),
      }),
    );

    if (result.kind === "ok") {
      expect(result.block).toEqual(updated);
    }
  });

  it("version increment is applied in update-block data", async () => {
    const tx = makeTx();

    vi.mocked(tx.block.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(tx.block.findUnique).mockResolvedValue(mockBlock());

    await applyOpInTx(tx, {
      kind: "update-block",
      blockId: "block-1",
      expectedVersion: 1,
      fullEntity: FULL_BLOCK,
    });

    const call = vi.mocked(tx.block.updateMany).mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };

    expect(call.data.version).toEqual({ increment: 1 });
  });

  it("conflict: returns conflict with current version when updateMany count=0", async () => {
    const tx = makeTx();

    vi.mocked(tx.block.updateMany).mockResolvedValue({ count: 0 });
    vi.mocked(tx.block.findUnique).mockResolvedValue(mockBlock({ version: 5 }));

    const result = await applyOpInTx(tx, {
      kind: "update-block",
      blockId: "block-1",
      expectedVersion: 999,
      fullEntity: FULL_BLOCK,
    });

    expect(result).toEqual({ kind: "conflict", currentVersion: 5 });
  });

  it("not-found: throws NotFoundError when block is missing", async () => {
    const tx = makeTx();

    vi.mocked(tx.block.updateMany).mockResolvedValue({ count: 0 });
    vi.mocked(tx.block.findUnique).mockResolvedValue(null);

    await expect(
      applyOpInTx(tx, {
        kind: "update-block",
        blockId: "missing-id",
        expectedVersion: 1,
        fullEntity: FULL_BLOCK,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("bulk-patch-apply-op / move-block", () => {
  it("happy path: updateMany called with targetSessionId/targetOrder, returns block", async () => {
    const tx = makeTx();
    const moved = mockBlock({ sessionId: "session-2", order: 3, version: 2 });

    vi.mocked(tx.block.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(tx.block.findUnique).mockResolvedValue(moved);

    const result = await applyOpInTx(tx, {
      kind: "move-block",
      blockId: "block-1",
      expectedVersion: 1,
      targetSessionId: "session-2",
      targetOrder: 3,
    });

    expect(tx.block.updateMany).toHaveBeenCalledWith({
      where: { id: "block-1", version: 1 },
      data: { sessionId: "session-2", order: 3, version: { increment: 1 } },
    });
    expect(result.kind).toBe("ok");

    if (result.kind === "ok") {
      expect(result.block).toEqual(moved);
    }
  });

  it("version increment is applied in move-block data", async () => {
    const tx = makeTx();

    vi.mocked(tx.block.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(tx.block.findUnique).mockResolvedValue(mockBlock());

    await applyOpInTx(tx, {
      kind: "move-block",
      blockId: "block-1",
      expectedVersion: 1,
      targetSessionId: "session-2",
      targetOrder: 0,
    });

    const call = vi.mocked(tx.block.updateMany).mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };

    expect(call.data.version).toEqual({ increment: 1 });
  });

  it("conflict: returns conflict when version mismatch", async () => {
    const tx = makeTx();

    vi.mocked(tx.block.updateMany).mockResolvedValue({ count: 0 });
    vi.mocked(tx.block.findUnique).mockResolvedValue(mockBlock({ version: 4 }));

    const result = await applyOpInTx(tx, {
      kind: "move-block",
      blockId: "block-1",
      expectedVersion: 99,
      targetSessionId: "session-2",
      targetOrder: 0,
    });

    expect(result).toEqual({ kind: "conflict", currentVersion: 4 });
  });

  it("not-found: throws NotFoundError when block is missing", async () => {
    const tx = makeTx();

    vi.mocked(tx.block.updateMany).mockResolvedValue({ count: 0 });
    vi.mocked(tx.block.findUnique).mockResolvedValue(null);

    await expect(
      applyOpInTx(tx, {
        kind: "move-block",
        blockId: "missing-block",
        expectedVersion: 1,
        targetSessionId: "s",
        targetOrder: 0,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
