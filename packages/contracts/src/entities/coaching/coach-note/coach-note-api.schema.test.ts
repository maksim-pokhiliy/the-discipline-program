import { describe, expect, it } from "vitest";

import { getCoachNotesQuerySchema } from "./coach-note-api.schema";

const VALID_CUID = "clz00000000000000000fake1";

describe("getCoachNotesQuerySchema", () => {
  it("accepts an empty query (no filter)", () => {
    expect(getCoachNotesQuerySchema.safeParse({}).success).toBe(true);
  });

  it("accepts a valid athleteId", () => {
    expect(getCoachNotesQuerySchema.safeParse({ athleteId: VALID_CUID }).success).toBe(true);
  });

  it("rejects a non-cuid athleteId", () => {
    expect(getCoachNotesQuerySchema.safeParse({ athleteId: "not-a-cuid" }).success).toBe(false);
  });
});
