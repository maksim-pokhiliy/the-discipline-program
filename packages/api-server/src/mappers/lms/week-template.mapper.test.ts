import { type WeekTemplate as PrismaWeekTemplate } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { mapToWeekTemplate } from "./week-template.mapper";

const validPayload = {
  week: { label: null, notes: null },
  days: [
    {
      dayOfWeek: "MON",
      kind: "TRAINING",
      notes: null,
      sessions: [
        {
          session: { order: 0, label: null, notes: null },
          blocks: [],
        },
      ],
    },
  ],
};

const makeRow = (overrides: Partial<PrismaWeekTemplate> = {}): PrismaWeekTemplate => ({
  id: "ckwttmaprow0000000000001",
  scope: "COACH",
  ownerId: "ckwtcoachowner000000001",
  name: "Sample week template",
  description: "Description",
  payload: validPayload,
  createdAt: new Date("2026-04-01T00:00:00.000Z"),
  updatedAt: new Date("2026-04-02T00:00:00.000Z"),
  deletedAt: null,
  ...overrides,
});

describe("mapToWeekTemplate", () => {
  it("maps a valid row with parsed payload (week + days)", () => {
    const result = mapToWeekTemplate(makeRow());

    expect(result.payload.week.label).toBeNull();
    expect(result.payload.days).toHaveLength(1);
    expect(result.payload.days[0]?.dayOfWeek).toBe("MON");
    expect(result.payload.days[0]?.kind).toBe("TRAINING");
  });

  it("rejects payload with invalid dayOfWeek enum", () => {
    const broken = {
      week: { label: null, notes: null },
      days: [{ dayOfWeek: "MONDAY", kind: "TRAINING", notes: null, sessions: [] }],
    };

    expect(() => mapToWeekTemplate(makeRow({ payload: broken }))).toThrow();
  });

  it("rejects payload missing days array", () => {
    const missingDays = { week: { label: null, notes: null } };

    expect(() => mapToWeekTemplate(makeRow({ payload: missingDays }))).toThrow();
  });
});
