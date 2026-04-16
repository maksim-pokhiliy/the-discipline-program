import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { searchUsersResponseSchema } from "@repo/contracts/iam/user";

import { cleanup, createTestCoach } from "../../test/helpers";

import { iamUserSearchApi } from "./users-search";

describe("iamUserSearchApi.search — empty DB", () => {
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

  it("returns empty array for a query that matches no users", async () => {
    const query = `no-match-${crypto.randomUUID()}`;
    const result = await iamUserSearchApi.search(coach.user.id, query);

    expect(result).toEqual([]);
  });

  it("result validates against response schema", async () => {
    const query = `no-match-${crypto.randomUUID()}`;
    const result = await iamUserSearchApi.search(coach.user.id, query);
    const parsed = searchUsersResponseSchema.safeParse(result);

    expect(parsed.success).toBe(true);
  });
});
