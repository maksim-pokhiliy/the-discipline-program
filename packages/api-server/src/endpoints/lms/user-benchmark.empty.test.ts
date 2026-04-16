import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getUserBenchmarksResponseSchema } from "@repo/contracts/lms/user-benchmark";

import { cleanup, createTestUser } from "../../test/helpers";

import { lmsUserBenchmarkApi } from "./user-benchmark";

describe("lmsUserBenchmarkApi.getByUser — empty DB", () => {
  let user: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    user = await createTestUser();
  });

  afterAll(async () => {
    await cleanup({ table: "user", id: user.id });
  });

  it("returns empty array for user with no benchmarks", async () => {
    const result = await lmsUserBenchmarkApi.getByUser(user.id, user.id);

    expect(result).toEqual([]);
  });

  it("result validates against response schema", async () => {
    const result = await lmsUserBenchmarkApi.getByUser(user.id, user.id);
    const parsed = getUserBenchmarksResponseSchema.safeParse(result);

    expect(parsed.success).toBe(true);
  });
});
