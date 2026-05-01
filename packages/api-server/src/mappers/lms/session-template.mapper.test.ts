import { type SessionTemplate as PrismaSessionTemplate } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { mapToSessionTemplate } from "./session-template.mapper";

const validPayload = {
  session: { order: 0, label: "Sample", notes: null },
  blocks: [
    {
      block: {
        order: 0,
        kindId: "ckblockkindcuid000000002",
        title: null,
        status: "ACTIVE",
        weight: 1,
        notes: null,
      },
      segments: [],
    },
  ],
};

const makeRow = (overrides: Partial<PrismaSessionTemplate> = {}): PrismaSessionTemplate => ({
  id: "cksttmaprow0000000000001",
  scope: "SYSTEM",
  ownerId: null,
  name: "Sample session template",
  description: null,
  payload: validPayload,
  version: 1,
  createdAt: new Date("2026-04-01T00:00:00.000Z"),
  updatedAt: new Date("2026-04-02T00:00:00.000Z"),
  deletedAt: null,
  ...overrides,
});

describe("mapToSessionTemplate", () => {
  it("maps a valid row with parsed payload (SYSTEM scope, ownerId null)", () => {
    const result = mapToSessionTemplate(makeRow());

    expect(result.scope).toBe("SYSTEM");
    expect(result.ownerId).toBeNull();
    expect(result.payload.session.label).toBe("Sample");
    expect(result.payload.blocks).toHaveLength(1);
  });

  it("rejects payload missing session", () => {
    expect(() =>
      mapToSessionTemplate(makeRow({ payload: { blocks: [] } as unknown as object })),
    ).toThrow();
  });

  it("rejects payload with malformed nested block (missing kindId)", () => {
    const broken = {
      session: { order: 0, label: null, notes: null },
      blocks: [
        {
          block: { order: 0, title: null, status: "ACTIVE", weight: 1, notes: null },
          segments: [],
        },
      ],
    };

    expect(() => mapToSessionTemplate(makeRow({ payload: broken }))).toThrow();
  });
});
