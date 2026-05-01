import { type BlockTemplate as PrismaBlockTemplate } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { mapToBlockTemplate } from "./block-template.mapper";

const validPayload = {
  block: {
    order: 0,
    kindId: "ckblockkindcuid000000001",
    title: "Demo block",
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

const makeRow = (overrides: Partial<PrismaBlockTemplate> = {}): PrismaBlockTemplate => ({
  id: "ckbtmaprow0000000000001",
  scope: "COACH",
  ownerId: "ckcoachownercuid00000001",
  name: "Sample template",
  description: null,
  payload: validPayload,
  version: 1,
  createdAt: new Date("2026-04-01T00:00:00.000Z"),
  updatedAt: new Date("2026-04-02T00:00:00.000Z"),
  deletedAt: null,
  ...overrides,
});

describe("mapToBlockTemplate", () => {
  it("maps a valid row with parsed payload", () => {
    const result = mapToBlockTemplate(makeRow());

    expect(result.id).toBe("ckbtmaprow0000000000001");
    expect(result.scope).toBe("COACH");
    expect(result.ownerId).toBe("ckcoachownercuid00000001");
    expect(result.payload.block.kindId).toBe("ckblockkindcuid000000001");
    expect(result.payload.segments).toHaveLength(1);
    expect(result.payload.segments[0]?.archetypeKind).toBe("COUNT_DOWN");
  });

  it("preserves nullable description and deletedAt", () => {
    const result = mapToBlockTemplate(
      makeRow({ description: "with descr", deletedAt: new Date("2026-04-10T00:00:00.000Z") }),
    );

    expect(result.description).toBe("with descr");
    expect(result.deletedAt).not.toBeNull();
  });

  it("rejects payload missing required block field", () => {
    const broken = { block: { order: 0 }, segments: [] };

    expect(() => mapToBlockTemplate(makeRow({ payload: broken }))).toThrow();
  });

  it("rejects payload with mismatched scheme params kind", () => {
    const broken = {
      block: validPayload.block,
      segments: [
        {
          order: 0,
          label: null,
          archetypeKind: "COUNT_DOWN",
          schemeParams: { kind: "INVALID_KIND" },
          schemeTemplateId: null,
          restConfig: null,
          setGroups: [],
        },
      ],
    };

    expect(() => mapToBlockTemplate(makeRow({ payload: broken }))).toThrow();
  });

  it("rejects entirely malformed payload", () => {
    expect(() => mapToBlockTemplate(makeRow({ payload: null as unknown as object }))).toThrow();
  });
});
