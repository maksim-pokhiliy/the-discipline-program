import { describe, expect, it } from "vitest";

import { coachAthletesDataSchema } from "./coach-athletes-api.schema";

describe("coach-athletes-api schema empty payloads", () => {
  it("coachAthletesDataSchema accepts empty athletes and zeroed summary", () => {
    const result = coachAthletesDataSchema.safeParse({
      athletes: [],
      summary: {
        total: 0,
        active: 0,
        needsAttention: 0,
        injured: 0,
        restricted: 0,
      },
    });

    expect(result.success).toBe(true);
  });

  it("coachAthletesDataSchema rejects missing summary", () => {
    const result = coachAthletesDataSchema.safeParse({ athletes: [] });

    expect(result.success).toBe(false);
  });

  it("coachAthletesDataSchema rejects missing athletes array", () => {
    const result = coachAthletesDataSchema.safeParse({
      summary: {
        total: 0,
        active: 0,
        needsAttention: 0,
        injured: 0,
        restricted: 0,
      },
    });

    expect(result.success).toBe(false);
  });

  it("coachAthletesDataSchema rejects negative summary counts", () => {
    const result = coachAthletesDataSchema.safeParse({
      athletes: [],
      summary: {
        total: -1,
        active: 0,
        needsAttention: 0,
        injured: 0,
        restricted: 0,
      },
    });

    expect(result.success).toBe(false);
  });

  it("coachAthletesDataSchema rejects null", () => {
    const result = coachAthletesDataSchema.safeParse(null);

    expect(result.success).toBe(false);
  });
});
