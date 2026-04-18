import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { NotFoundError } from "@repo/errors";

import { cleanup, createTestUser } from "../../test/helpers";

import { coachingCoachProfileApi } from "./coach-profile";

describe("coachingCoachProfileApi.get — empty DB", () => {
  let userWithoutProfile: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    userWithoutProfile = await createTestUser();
  });

  afterAll(async () => {
    await cleanup({ table: "user", id: userWithoutProfile.id });
  });

  it("throws NotFoundError for user without a coach profile", async () => {
    await expect(coachingCoachProfileApi.get(userWithoutProfile.id)).rejects.toThrow(NotFoundError);
  });
});
