import { describe, expect, it } from "vitest";

import { BLOCK_CONSTANTS } from "./block.constants";
import {
  assignBlockLabelsSchema,
  blockSchema,
  createBlockSchema,
  reorderBlocksSchema,
  updateBlockSchema,
} from "./block.schema";

const labelOne = {
  id: "clz1234567890123456789aaa",
  name: "warmup",
  nameLower: "warmup",
  applicableLevels: ["BLOCK"] as const,
  notes: null,
  rest: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const labelTwo = {
  ...labelOne,
  id: "clz1234567890123456789bbb",
  name: "strength",
  nameLower: "strength",
};

const cuidA = "clz1234567890123456789aaa";
const cuidB = "clz1234567890123456789bbb";
const cuidC = "clz1234567890123456789ccc";

const atomicSchema = {
  id: "clz1234567890123456789sa1",
  blockId: "clz1234567890123456789012",
  parentSchemaId: null,
  alternatingGroupId: null,
  order: 1,
  kind: "ATOMIC" as const,
  archetypeId: "clz1234567890123456789ar1",
  header: null,
  archetypeParams: {
    archetype: "n-rounds" as const,
    params: { countForm: "exact" as const, count: 5 },
  },
  intensity: null,
  trailingConnector: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const restSlotRow = {
  id: "clz1234567890123456789rr1",
  schemaId: "clz1234567890123456789sa1",
  order: 1,
  rowKind: "REST_SLOT" as const,
  rowPayload: { rowKind: "REST_SLOT" as const },
  load: null,
  reps: null,
  side: null,
  tempo: null,
  position: null,
  sequence: null,
  intensity: null,
  media: null,
  compoundRep: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const schemaWithBody = {
  schema: atomicSchema,
  rows: [restSlotRow],
  subSchemas: [],
};

const alternatingGroup = {
  id: "clz1234567890123456789ag1",
  blockId: "clz1234567890123456789012",
  relationKind: "ALTERNATING_SETS" as const,
  schemaIds: [cuidA, cuidB],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseBlock = {
  id: "clz1234567890123456789012",
  sessionId: "clz1234567890123456789ccc",
  order: 10,
  intensity: { rpe: { value: 7 } },
  timeCap: { min: 10, max: 15, unit: "min" as const },
  notes: "block focus",
  labels: [labelOne],
  schemas: [],
  alternatingGroups: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("blockSchema", () => {
  it("accepts a fully-populated valid object (with intensity + timeCap + labels)", () => {
    const result = blockSchema.safeParse(baseBlock);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.id).toBe(baseBlock.id);
      expect(result.data.sessionId).toBe(baseBlock.sessionId);
      expect(result.data.order).toBe(10);
      expect(result.data.intensity).toEqual({ rpe: { value: 7 } });
      expect(result.data.timeCap).toEqual({ min: 10, max: 15, unit: "min" });
      expect(result.data.labels).toHaveLength(1);
    }
  });

  it("accepts intensity: null, timeCap: null, notes: null", () => {
    const result = blockSchema.safeParse({
      ...baseBlock,
      intensity: null,
      timeCap: null,
      notes: null,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.intensity).toBeNull();
      expect(result.data.timeCap).toBeNull();
      expect(result.data.notes).toBeNull();
    }
  });

  it("accepts labels: [] (implicit block per domain §1.3)", () => {
    const result = blockSchema.safeParse({ ...baseBlock, labels: [] });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.labels).toEqual([]);
    }
  });

  it("accepts labels with multiple entries", () => {
    const result = blockSchema.safeParse({ ...baseBlock, labels: [labelOne, labelTwo] });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.labels).toHaveLength(2);
    }
  });

  it("rejects order: 0 and order: -1", () => {
    expect(blockSchema.safeParse({ ...baseBlock, order: 0 }).success).toBe(false);
    expect(blockSchema.safeParse({ ...baseBlock, order: -1 }).success).toBe(false);
  });

  it("rejects order: 1.5 (non-integer)", () => {
    expect(blockSchema.safeParse({ ...baseBlock, order: 1.5 }).success).toBe(false);
  });

  it("rejects a non-cuid id", () => {
    expect(blockSchema.safeParse({ ...baseBlock, id: "not-a-cuid" }).success).toBe(false);
  });

  it("rejects a non-cuid sessionId", () => {
    expect(blockSchema.safeParse({ ...baseBlock, sessionId: "not-a-cuid" }).success).toBe(false);
  });

  it("accepts schemas: [] and alternatingGroups: [] (block without an embed tree)", () => {
    const result = blockSchema.safeParse(baseBlock);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.schemas).toEqual([]);
      expect(result.data.alternatingGroups).toEqual([]);
    }
  });

  it("accepts a populated schemas embed and alternatingGroups", () => {
    const result = blockSchema.safeParse({
      ...baseBlock,
      schemas: [schemaWithBody],
      alternatingGroups: [alternatingGroup],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.schemas).toHaveLength(1);
      expect(result.data.schemas[0]?.schema.id).toBe(atomicSchema.id);
      expect(result.data.schemas[0]?.rows).toHaveLength(1);
      expect(result.data.schemas[0]?.rows[0]?.id).toBe(restSlotRow.id);
      expect(result.data.schemas[0]?.subSchemas).toEqual([]);
      expect(result.data.alternatingGroups).toHaveLength(1);
      expect(result.data.alternatingGroups[0]?.id).toBe(alternatingGroup.id);
      expect(result.data.alternatingGroups[0]?.schemaIds).toEqual([cuidA, cuidB]);
    }
  });

  it("does not expose name (Block.name guardrail, parallel to Session.name Q10)", () => {
    expect(blockSchema.shape).not.toHaveProperty("name");
  });
});

describe("createBlockSchema", () => {
  it("accepts an empty object (instant-create block)", () => {
    const result = createBlockSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it("accepts intensity-only payload", () => {
    const result = createBlockSchema.safeParse({ intensity: { rpe: { value: 7 } } });

    expect(result.success).toBe(true);
  });

  it("accepts timeCap-only payload", () => {
    const result = createBlockSchema.safeParse({ timeCap: { min: 5, unit: "min" } });

    expect(result.success).toBe(true);
  });

  it("accepts notes-only payload", () => {
    const result = createBlockSchema.safeParse({ notes: "focus" });

    expect(result.success).toBe(true);
  });

  it("accepts labelIds-only payload", () => {
    const result = createBlockSchema.safeParse({ labelIds: [cuidA, cuidB] });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.labelIds).toEqual([cuidA, cuidB]);
    }
  });

  it("accepts labelIds: [] (empty)", () => {
    const result = createBlockSchema.safeParse({ labelIds: [] });

    expect(result.success).toBe(true);
  });

  it("accepts notes at MAX_NOTES_LENGTH", () => {
    const result = createBlockSchema.safeParse({
      notes: "x".repeat(BLOCK_CONSTANTS.MAX_NOTES_LENGTH),
    });

    expect(result.success).toBe(true);
  });

  it("rejects notes longer than MAX_NOTES_LENGTH", () => {
    const result = createBlockSchema.safeParse({
      notes: "x".repeat(BLOCK_CONSTANTS.MAX_NOTES_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });

  it("rejects labelIds longer than MAX_LABELS_PER_BLOCK", () => {
    const tooMany = Array.from(
      { length: BLOCK_CONSTANTS.MAX_LABELS_PER_BLOCK + 1 },
      (_, i) => `clz123456789012345678${i.toString().padStart(4, "x")}`,
    );

    const result = createBlockSchema.safeParse({ labelIds: tooMany });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate labelIds", () => {
    const result = createBlockSchema.safeParse({ labelIds: [cuidA, cuidB, cuidA] });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("labelIds must be unique");
    }
  });

  it("rejects a non-cuid in labelIds", () => {
    expect(createBlockSchema.safeParse({ labelIds: [cuidA, "not-a-cuid"] }).success).toBe(false);
  });

  it("rejects intensity: {} (refine at-least-one via _shared)", () => {
    expect(createBlockSchema.safeParse({ intensity: {} }).success).toBe(false);
  });
});

describe("updateBlockSchema", () => {
  it("is an alias of createBlockSchema (identity)", () => {
    expect(updateBlockSchema).toBe(createBlockSchema);
  });

  it("accepts an empty object", () => {
    expect(updateBlockSchema.safeParse({}).success).toBe(true);
  });

  it("accepts intensity-only payload", () => {
    expect(updateBlockSchema.safeParse({ intensity: { pace: "easy" } }).success).toBe(true);
  });

  it("accepts timeCap-only payload", () => {
    expect(updateBlockSchema.safeParse({ timeCap: { min: 5, unit: "min" } }).success).toBe(true);
  });

  it("accepts notes-only payload", () => {
    expect(updateBlockSchema.safeParse({ notes: "updated" }).success).toBe(true);
  });

  it("accepts labelIds-only payload", () => {
    expect(updateBlockSchema.safeParse({ labelIds: [cuidA] }).success).toBe(true);
  });

  it("accepts { intensity: null, timeCap: null, notes: null } (explicit clear)", () => {
    const result = updateBlockSchema.safeParse({
      intensity: null,
      timeCap: null,
      notes: null,
    });

    expect(result.success).toBe(true);
  });
});

describe("reorderBlocksSchema", () => {
  it("accepts an array of three cuids", () => {
    const result = reorderBlocksSchema.safeParse({
      orderedIds: [cuidA, cuidB, cuidC],
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty array (min(1))", () => {
    expect(reorderBlocksSchema.safeParse({ orderedIds: [] }).success).toBe(false);
  });

  it("rejects duplicate cuids", () => {
    const result = reorderBlocksSchema.safeParse({
      orderedIds: [cuidA, cuidB, cuidA],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("orderedIds must be unique");
    }
  });

  it("rejects a non-cuid string", () => {
    expect(reorderBlocksSchema.safeParse({ orderedIds: [cuidA, "not-a-cuid"] }).success).toBe(
      false,
    );
  });
});

describe("assignBlockLabelsSchema", () => {
  it("accepts labelIds: [] (clear all labels)", () => {
    const result = assignBlockLabelsSchema.safeParse({ labelIds: [] });

    expect(result.success).toBe(true);
  });

  it("accepts up to MAX_LABELS_PER_BLOCK", () => {
    const max = Array.from(
      { length: BLOCK_CONSTANTS.MAX_LABELS_PER_BLOCK },
      (_, i) => `clz123456789012345678${i.toString().padStart(4, "x")}`,
    );

    const result = assignBlockLabelsSchema.safeParse({ labelIds: max });

    expect(result.success).toBe(true);
  });

  it("rejects more than MAX_LABELS_PER_BLOCK", () => {
    const tooMany = Array.from(
      { length: BLOCK_CONSTANTS.MAX_LABELS_PER_BLOCK + 1 },
      (_, i) => `clz123456789012345678${i.toString().padStart(4, "x")}`,
    );

    expect(assignBlockLabelsSchema.safeParse({ labelIds: tooMany }).success).toBe(false);
  });

  it("rejects duplicate labelIds", () => {
    const result = assignBlockLabelsSchema.safeParse({
      labelIds: [cuidA, cuidB, cuidA],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("labelIds must be unique");
    }
  });

  it("rejects a non-cuid string", () => {
    expect(assignBlockLabelsSchema.safeParse({ labelIds: [cuidA, "not-a-cuid"] }).success).toBe(
      false,
    );
  });
});
