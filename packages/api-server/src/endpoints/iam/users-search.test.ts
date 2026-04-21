import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ForbiddenError } from "@repo/errors";

import { cleanup, createTestAssignment, createTestCoach, createTestUser } from "../../test/helpers";

import { iamUserSearchApi } from "./users-search";

describe("iamUserSearchApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let regularUser: Awaited<ReturnType<typeof createTestUser>>;
  let searchableUser: Awaited<ReturnType<typeof createTestUser>>;
  let assignmentId: string;

  const uniqueMarker = crypto.randomUUID().slice(0, 8);
  const searchableName = `Searchable ${uniqueMarker}`;
  const searchableEmail = `searchable-${uniqueMarker}@test.local`;

  beforeAll(async () => {
    coach = await createTestCoach();
    regularUser = await createTestUser();
    searchableUser = await createTestUser({
      name: searchableName,
      email: searchableEmail,
    });

    const assignment = await createTestAssignment(coach.profile.id, searchableUser.id);

    assignmentId = assignment.id;
  });

  afterAll(async () => {
    await cleanup(
      { table: "coachAthleteAssignment", id: assignmentId },
      { table: "coachProfile", id: coach.profile.id },
      { table: "user", id: coach.user.id },
      { table: "user", id: regularUser.id },
      { table: "user", id: searchableUser.id },
    );
  });

  describe("search", () => {
    it("finds user by name substring", async () => {
      const results = await iamUserSearchApi.search(coach.user.id, uniqueMarker);

      const found = results.find((u) => u.id === searchableUser.id);

      expect(found).toBeDefined();
      expect(found?.name).toBe(searchableName);
    });

    it("finds user by email substring", async () => {
      const results = await iamUserSearchApi.search(coach.user.id, `searchable-${uniqueMarker}`);

      const found = results.find((u) => u.id === searchableUser.id);

      expect(found).toBeDefined();
      expect(found?.email).toBe(searchableEmail);
    });

    it("performs case-insensitive search", async () => {
      const results = await iamUserSearchApi.search(coach.user.id, uniqueMarker.toUpperCase());

      const found = results.find((u) => u.id === searchableUser.id);

      expect(found).toBeDefined();
    });

    it("excludes the calling user from results", async () => {
      const results = await iamUserSearchApi.search(coach.user.id, coach.user.name ?? "");

      const found = results.find((u) => u.id === coach.user.id);

      expect(found).toBeUndefined();
    });

    it("throws ForbiddenError for non-coach user", async () => {
      await expect(iamUserSearchApi.search(regularUser.id, "anything")).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("returns empty array for no matches", async () => {
      const results = await iamUserSearchApi.search(
        coach.user.id,
        `nonexistent-${crypto.randomUUID()}`,
      );

      expect(results).toEqual([]);
    });

    it("excludes athletes not assigned to the calling coach", async () => {
      const unassignedUser = await createTestUser({
        name: `Unassigned ${uniqueMarker}`,
        email: `unassigned-${uniqueMarker}@test.local`,
      });

      try {
        const results = await iamUserSearchApi.search(coach.user.id, uniqueMarker);

        expect(results.some((u) => u.id === unassignedUser.id)).toBe(false);
        expect(results.some((u) => u.id === searchableUser.id)).toBe(true);
      } finally {
        await cleanup({ table: "user", id: unassignedUser.id });
      }
    });
  });
});
