import { describe, expect, it } from "vitest";

import type { SessionWithLabel } from "@repo/contracts/lms/day";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import { computeDayStats } from "./compute-day-stats";

const now = new Date("2025-01-06T00:00:00Z");

const makeSchema = (): SchemaWithBody => ({
  schema: {
    id: "clp9z8x7w0000abcd1234sch1",
    blockId: "clp9z8x7w0000abcd1234blk1",
    parentSchemaId: null,
    alternatingGroupId: null,
    order: 10,
    kind: "ATOMIC",
    archetypeId: "clp9z8x7w0000abcd1234arc1",
    header: null,
    archetypeParams: { archetype: "amrap-flat", params: { durationMin: 10 } },
    intensity: null,
    trailingConnector: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
  },
  rows: [],
  subSchemas: [],
});

type MakeBlockOptions = {
  schemaCount: number;
};

const makeBlock = ({ schemaCount }: MakeBlockOptions): SessionWithLabel["blocks"][number] => ({
  id: "clp9z8x7w0000abcd1234blk1",
  sessionId: "clp9z8x7w0000abcd1234ses1",
  order: 10,
  intensity: null,
  timeCap: null,
  notes: null,
  labels: [],
  schemas: Array.from({ length: schemaCount }, makeSchema),
  alternatingGroups: [],
  createdAt: now,
  updatedAt: now,
});

type MakeSessionOptions = {
  blockSchemaCounts?: number[];
  notes?: string | null;
};

const makeSession = ({
  blockSchemaCounts = [],
  notes = null,
}: MakeSessionOptions): SessionWithLabel => ({
  id: "clp9z8x7w0000abcd1234ses1",
  dayId: "clp9z8x7w0000abcd1234day1",
  order: 10,
  labelId: null,
  notes,
  freezeLoadsAtCreation: false,
  createdAt: now,
  updatedAt: now,
  label: null,
  blocks: blockSchemaCounts.map((schemaCount) => makeBlock({ schemaCount })),
});

describe("computeDayStats", () => {
  it("returns zeroes for an empty sessions list", () => {
    expect(computeDayStats([])).toEqual({ blocks: 0, schemas: 0, estMinutes: 0 });
  });

  it("counts blocks and schemas across a single session", () => {
    const session = makeSession({ blockSchemaCounts: [3, 2] });

    expect(computeDayStats([session])).toEqual({ blocks: 2, schemas: 5, estMinutes: 0 });
  });

  it("aggregates counts across multiple sessions", () => {
    const sessions = [
      makeSession({ blockSchemaCounts: [1] }),
      makeSession({ blockSchemaCounts: [2, 3] }),
    ];

    expect(computeDayStats(sessions)).toEqual({ blocks: 3, schemas: 6, estMinutes: 0 });
  });

  it("parses the estimated minutes from a session notes string", () => {
    const session = makeSession({ notes: "warmup, ~75 min, then cooldown" });

    expect(computeDayStats([session]).estMinutes).toBe(75);
  });

  it("returns zero minutes when no min substring is present in notes", () => {
    const session = makeSession({ notes: "minimal cues only" });

    expect(computeDayStats([session]).estMinutes).toBe(0);
  });

  it("matches mixed-case MIN suffix and sums across mixed sessions", () => {
    const sessions = [
      makeSession({ notes: "30 MIN" }),
      makeSession({ notes: null }),
      makeSession({ notes: "60 min" }),
    ];

    expect(computeDayStats(sessions).estMinutes).toBe(90);
  });

  it("rejects partial 'min' prefix inside a longer word like 'minute' (QA-006)", () => {
    const session = makeSession({ notes: "45 minute walk" });

    expect(computeDayStats([session]).estMinutes).toBe(0);
  });

  it("accepts 'min' as the trailing token of the notes string (QA-006)", () => {
    const session = makeSession({ notes: "60 min" });

    expect(computeDayStats([session]).estMinutes).toBe(60);
  });

  it("accepts 'min' followed by trailing non-alpha tokens (QA-006)", () => {
    const session = makeSession({ notes: "45 min total" });

    expect(computeDayStats([session]).estMinutes).toBe(45);
  });
});
