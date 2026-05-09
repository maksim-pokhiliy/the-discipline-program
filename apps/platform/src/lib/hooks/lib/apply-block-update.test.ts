import { describe, expect, it } from "vitest";

import type { GetPlanBlocksResponse, PlanBlock } from "@repo/contracts/lms/plan-block";

import { applyBlockUpdate } from "./apply-block-update";

const NOW = new Date("2026-05-08T00:00:00.000Z");

const makeBlock = (overrides: Partial<PlanBlock> = {}): PlanBlock => ({
  id: "ckxblockid000000000000001",
  sessionId: "ckxsessionid00000000000001",
  order: 0,
  schemeTypeId: "ckxschemetype0000000000001",
  blockTypeIds: ["ckxblocktypeid00000000001"],
  schemeParams: { kind: "NONE" },
  modifiers: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeResponse = (blocks: PlanBlock[]): GetPlanBlocksResponse => ({ blocks });

describe("applyBlockUpdate", () => {
  it("applies scalar patch to the matching block and leaves others unchanged", () => {
    const target = makeBlock({ id: "ckxblockid000000000000001", order: 0, notes: null });
    const sibling = makeBlock({ id: "ckxblockid000000000000002", order: 1, notes: "keep" });
    const next = applyBlockUpdate(makeResponse([target, sibling]), target.id, {
      order: 5,
      notes: "updated",
    });

    expect(next.blocks).toHaveLength(2);
    expect(next.blocks[0]?.order).toBe(5);
    expect(next.blocks[0]?.notes).toBe("updated");
    expect(next.blocks[1]).toEqual(sibling);
  });

  it("returns the response unchanged when no block matches the supplied id", () => {
    const block = makeBlock({ id: "ckxblockid000000000000001" });
    const prev = makeResponse([block]);
    const next = applyBlockUpdate(prev, "ckxblockid000000000000099", { order: 9 });

    expect(next.blocks).toEqual([block]);
  });

  it("preserves existing fields when patch leaves them undefined", () => {
    const block = makeBlock({ notes: "stay", order: 3 });
    const next = applyBlockUpdate(makeResponse([block]), block.id, { schemeTypeId: undefined });

    expect(next.blocks[0]?.notes).toBe("stay");
    expect(next.blocks[0]?.order).toBe(3);
    expect(next.blocks[0]?.schemeTypeId).toBe(block.schemeTypeId);
  });

  it("does not touch items because the helper is block-scalar only", () => {
    const block = makeBlock();
    const next = applyBlockUpdate(makeResponse([block]), block.id, {
      items: [
        {
          order: 0,
          exerciseId: "ckxexerciseid00000000000001",
          prescription: {
            reps: { kind: "FIXED", value: 10 },
            sideMode: "BILATERAL",
            modifiers: [],
          },
        },
      ],
    });

    expect(next.blocks[0]).not.toHaveProperty("items");
    expect(next.blocks[0]).toEqual(block);
  });
});
