import { type Block as PrismaBlock, BlockStatus as PrismaBlockStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { mapToBlock } from "./block.mapper";

const makeRow = (overrides: Partial<PrismaBlock> = {}): PrismaBlock => ({
  id: "cls_block_1",
  sessionId: "cls_sess_1",
  order: 0,
  kindId: "cls_kind_1",
  title: null,
  status: PrismaBlockStatus.ACTIVE,
  weight: 1,
  notes: null,
  version: 1,
  ...overrides,
});

describe("mapToBlock", () => {
  it("maps a happy-path Block row", () => {
    const result = mapToBlock(makeRow());

    expect(result).toEqual({
      id: "cls_block_1",
      sessionId: "cls_sess_1",
      order: 0,
      kindId: "cls_kind_1",
      title: null,
      status: "ACTIVE",
      weight: 1,
      notes: null,
      version: 1,
    });
  });

  it("preserves nullable title and notes", () => {
    const result = mapToBlock(makeRow({ title: "Warmup", notes: "Take it easy" }));

    expect(result.title).toBe("Warmup");
    expect(result.notes).toBe("Take it easy");
  });

  it("exposes version on output", () => {
    const result = mapToBlock(makeRow({ version: 12 }));

    expect(result.version).toBe(12);
  });
});
