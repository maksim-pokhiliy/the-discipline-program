import { describe, expect, it } from "vitest";

import { getCoachesListResponseSchema } from "@repo/contracts/iam/user";

import { iamAdminCoachListApi } from "./admin-coach-list";

describe("iamAdminCoachListApi.getAll — empty-contract", () => {
  it("always returns an array (never null/undefined) that validates against the response schema", async () => {
    const coaches = await iamAdminCoachListApi.getAll();

    expect(Array.isArray(coaches)).toBe(true);

    const parsed = getCoachesListResponseSchema.safeParse(coaches);

    expect(parsed.success).toBe(true);
  });
});
