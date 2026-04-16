import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { adminUserListItemSchema } from "@repo/contracts/iam/user";

import { cleanup, createTestUser } from "../../test/helpers";

import { iamUserAdminApi } from "./users-admin";

describe("iamUserAdminApi — response shape on minimal scope", () => {
  let testUser: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    testUser = await createTestUser({ timezone: "Europe/Kiev" });
  });

  afterAll(async () => {
    await cleanup({ table: "user", id: testUser.id });
  });

  it("getAll always returns an array, never null or undefined", async () => {
    const result = await iamUserAdminApi.getAll();

    expect(Array.isArray(result)).toBe(true);
  });

  it("getPageData wraps the array under 'users' key", async () => {
    const result = await iamUserAdminApi.getPageData();

    expect(Array.isArray(result.users)).toBe(true);
    expect(result.users.length).toBe((await iamUserAdminApi.getAll()).length);
  });

  it("the freshly-created user appears in getAll and matches the list-item schema", async () => {
    const result = await iamUserAdminApi.getAll();
    const found = result.find((u) => u.id === testUser.id);

    expect(found).toBeDefined();

    const parsed = adminUserListItemSchema.safeParse(found);

    expect(parsed.success).toBe(true);
  });

  it("filtering by an unknown email yields no matching list items", async () => {
    const noMatchEmail = `no-match-${crypto.randomUUID()}@test.local`;
    const result = await iamUserAdminApi.getAll();
    const matching = result.filter((u) => u.email === noMatchEmail);

    expect(matching).toEqual([]);
  });
});
