import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { NotFoundError } from "@repo/errors";

import { cleanup, createTestUser } from "../../test/helpers";

import { coachingAthleteProfileApi } from "./athlete-profile";

describe("coachingAthleteProfileApi.get — empty DB", () => {
  let userWithoutProfile: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    userWithoutProfile = await createTestUser();
  });

  afterAll(async () => {
    await cleanup({ table: "user", id: userWithoutProfile.id });
  });

  it("throws NotFoundError for user with no athlete profile", async () => {
    await expect(coachingAthleteProfileApi.get(userWithoutProfile.id)).rejects.toThrow(
      NotFoundError,
    );
  });
});
