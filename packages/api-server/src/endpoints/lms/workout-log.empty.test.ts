import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getWorkoutLogsResponseSchema } from "@repo/contracts/lms/workout-log";

import { cleanup, createTestUser } from "../../test/helpers";

import { lmsWorkoutLogApi } from "./workout-log";

describe("lmsWorkoutLogApi.getAll — empty DB", () => {
  let user: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    user = await createTestUser();
  });

  afterAll(async () => {
    await cleanup({ table: "user", id: user.id });
  });

  it("returns empty array for user with no logs", async () => {
    const result = await lmsWorkoutLogApi.getAll(user.id);

    expect(result).toEqual([]);
  });

  it("result validates against response schema", async () => {
    const result = await lmsWorkoutLogApi.getAll(user.id);
    const parsed = getWorkoutLogsResponseSchema.safeParse(result);

    expect(parsed.success).toBe(true);
  });
});
