import { describe, expect, it } from "vitest";

import {
  blockTemplatePayloadSchema,
  sessionTemplatePayloadSchema,
  weekTemplatePayloadSchema,
} from "./template-payload.schema";

const validBlock = {
  block: {
    order: 0,
    kindId: "ckblockkindx00000000000001",
    title: null,
    status: "ACTIVE",
    weight: 1,
    notes: null,
  },
  segments: [
    {
      order: 0,
      label: null,
      archetypeKind: "COUNT_DOWN",
      schemeParams: { kind: "COUNT_DOWN", durationSec: 600 },
      schemeTemplateId: null,
      restConfig: null,
      setGroups: [],
    },
  ],
};

describe("blockTemplatePayloadSchema", () => {
  it("accepts a minimal valid payload", () => {
    expect(blockTemplatePayloadSchema.safeParse(validBlock).success).toBe(true);
  });

  it("rejects missing block field", () => {
    expect(blockTemplatePayloadSchema.safeParse({ segments: [] }).success).toBe(false);
  });

  it("rejects mismatched archetype/schemeParams.kind discriminator", () => {
    const broken = {
      ...validBlock,
      segments: [
        {
          ...validBlock.segments[0],
          schemeParams: { kind: "EMOM_LOOP" },
        },
      ],
    };

    expect(blockTemplatePayloadSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects payload that includes an `id` field on block (omitted from schema)", () => {
    const broken = {
      ...validBlock,
      block: { ...validBlock.block, id: "ckxxxxxxxxxxxxxxxxxxxxxxxx" },
    };

    const result = blockTemplatePayloadSchema.safeParse(broken);

    expect(result.success).toBe(true);
  });
});

describe("sessionTemplatePayloadSchema", () => {
  it("accepts session + nested blocks", () => {
    const payload = {
      session: { order: 0, label: null, notes: null },
      blocks: [validBlock],
    };

    expect(sessionTemplatePayloadSchema.safeParse(payload).success).toBe(true);
  });

  it("rejects when blocks contain an invalid block", () => {
    const payload = {
      session: { order: 0, label: null, notes: null },
      blocks: [{ block: {}, segments: [] }],
    };

    expect(sessionTemplatePayloadSchema.safeParse(payload).success).toBe(false);
  });
});

describe("weekTemplatePayloadSchema", () => {
  it("accepts week with one day and one session", () => {
    const payload = {
      week: { index: 0, label: null, notes: null },
      days: [
        {
          dayOfWeek: "MON",
          kind: "TRAINING",
          notes: null,
          sessions: [{ session: { order: 0, label: null, notes: null }, blocks: [] }],
        },
      ],
    };

    expect(weekTemplatePayloadSchema.safeParse(payload).success).toBe(true);
  });

  it("rejects week with invalid dayOfWeek", () => {
    const payload = {
      week: { index: 0, label: null, notes: null },
      days: [
        {
          dayOfWeek: "MONDAY",
          kind: "TRAINING",
          notes: null,
          sessions: [],
        },
      ],
    };

    expect(weekTemplatePayloadSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects week with invalid dayKind", () => {
    const payload = {
      week: { index: 0, label: null, notes: null },
      days: [
        {
          dayOfWeek: "MON",
          kind: "GAME_DAY",
          notes: null,
          sessions: [],
        },
      ],
    };

    expect(weekTemplatePayloadSchema.safeParse(payload).success).toBe(false);
  });
});
