import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { coachAthletesDataSchema } from "@repo/contracts/coaching/coach-athletes";

import { cleanup, createTestCoach } from "../../../test/helpers";

import { coachingCoachAthletesApi } from "./index";

describe("coachingCoachAthletesApi.getAthletes — empty DB", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;

  beforeAll(async () => {
    coach = await createTestCoach();
  });

  afterAll(async () => {
    await cleanup(
      { table: "coachProfile", id: coach.profile.id },
      { table: "user", id: coach.user.id },
    );
  });

  it("returns empty athletes array and zeroed summary for coach with no athletes", async () => {
    const result = await coachingCoachAthletesApi.getAthletes(coach.user.id);

    expect(result.athletes).toHaveLength(0);
    expect(result.summary.total).toBe(0);
    expect(result.summary.active).toBe(0);
    expect(result.summary.needsAttention).toBe(0);
    expect(result.summary.injured).toBe(0);
    expect(result.summary.restricted).toBe(0);
  });

  it("roundtrips through coachAthletesDataSchema", async () => {
    const result = await coachingCoachAthletesApi.getAthletes(coach.user.id);
    const parsed = coachAthletesDataSchema.safeParse(result);

    expect(parsed.success).toBe(true);
  });
});
