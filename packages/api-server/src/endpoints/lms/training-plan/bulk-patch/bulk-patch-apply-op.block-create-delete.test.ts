import { type Block as PrismaBlock } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@repo/errors";

import { type prisma } from "../../../../db/client";

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

describe("bulk-patch-apply-op / create-block", () => {
  it("happy path: block.create called with correct data, returns block", async () => {
    const tx = makeTx();
    const created = mockBlock({ id: "new-block", title: "Strength", version: 1 });

    vi.mocked(tx.block.create).mockResolvedValue(created);

    const result = await applyOpInTx(tx, {
      kind: "create-block",
      sessionId: "session-1",
      payload: { order: 0, kindId: "kind-1", title: "Strength", status: "ACTIVE", weight: 1 },
    });

    expect(tx.block.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sessionId: "session-1",
          order: 0,
          kindId: "kind-1",
          status: "ACTIVE",
        }),
      }),
    );
    expect(result.kind).toBe("ok");

    if (result.kind === "ok") {
      expect(result.block).toEqual(created);
    }
  });

  it("undefined title and notes become null in create data", async () => {
    const tx = makeTx();

    vi.mocked(tx.block.create).mockResolvedValue(mockBlock());

    await applyOpInTx(tx, {
      kind: "create-block",
      sessionId: "session-1",
      payload: { order: 0, kindId: "kind-1", status: "ACTIVE", weight: 1 },
    });

    const call = vi.mocked(tx.block.create).mock.calls[0]?.[0] as { data: Record<string, unknown> };

    expect(call.data.title).toBeNull();
    expect(call.data.notes).toBeNull();
  });

  it("no version field in create data (DB default applies)", async () => {
    const tx = makeTx();

    vi.mocked(tx.block.create).mockResolvedValue(mockBlock());

    await applyOpInTx(tx, {
      kind: "create-block",
      sessionId: "session-1",
      payload: { order: 0, kindId: "kind-1", status: "ACTIVE", weight: 1 },
    });

    const call = vi.mocked(tx.block.create).mock.calls[0]?.[0] as { data: Record<string, unknown> };

    expect(call.data.version).toBeUndefined();
  });
});

describe("bulk-patch-apply-op / delete-block", () => {
  it("happy path: block.deleteMany called, returns ok without entity", async () => {
    const tx = makeTx();

    vi.mocked(tx.block.deleteMany).mockResolvedValue({ count: 1 });

    const result = await applyOpInTx(tx, {
      kind: "delete-block",
      blockId: "block-1",
      expectedVersion: 1,
    });

    expect(tx.block.deleteMany).toHaveBeenCalledWith({ where: { id: "block-1", version: 1 } });
    expect(result).toEqual({ kind: "ok" });
  });

  it("conflict: returns conflict when deleteMany count=0", async () => {
    const tx = makeTx();

    vi.mocked(tx.block.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(tx.block.findUnique).mockResolvedValue(mockBlock({ version: 3 }));

    const result = await applyOpInTx(tx, {
      kind: "delete-block",
      blockId: "block-1",
      expectedVersion: 99,
    });

    expect(result).toEqual({ kind: "conflict", currentVersion: 3 });
  });

  it("not-found: throws NotFoundError when block is missing", async () => {
    const tx = makeTx();

    vi.mocked(tx.block.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(tx.block.findUnique).mockResolvedValue(null);

    await expect(
      applyOpInTx(tx, { kind: "delete-block", blockId: "missing-block", expectedVersion: 1 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
