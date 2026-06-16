import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ForbiddenError } from "@repo/errors";

import { cleanup, createTestCoach } from "../../../test/helpers";

import { coachingCoachAthletesApi } from "./index";

describe("coachingCoachAthletesApi.getAthleteProfile — empty DB", () => {
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

  it("throws ForbiddenError for a non-existent athlete id", async () => {
    await expect(
      coachingCoachAthletesApi.getAthleteProfile(coach.user.id, "cl000000000000000000000000"),
    ).rejects.toThrow(ForbiddenError);
  });
});
