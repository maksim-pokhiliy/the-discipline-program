import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { BadRequestError, NotFoundError } from "@repo/errors";

import { cleanup, cleanupRaw, createTestCoach, createTestCredential } from "../../test/helpers";

import { coachingCoachCredentialApi } from "./coach-credential";

describe("coachingCoachCredentialApi", () => {
  let coachA: Awaited<ReturnType<typeof createTestCoach>>;
  let coachB: Awaited<ReturnType<typeof createTestCoach>>;
  let coachBCredential: Awaited<ReturnType<typeof createTestCredential>>;
  const createdCredentialIds: string[] = [];

  beforeAll(async () => {
    coachA = await createTestCoach();
    coachB = await createTestCoach();
    coachBCredential = await createTestCredential(coachB.profile.id);
  });

  afterAll(async () => {
    await cleanup(
      ...createdCredentialIds.map((id) => ({ table: "coachCredential", id })),
      { table: "coachCredential", id: coachBCredential.id },
      { table: "coachProfile", id: coachA.profile.id },
      { table: "coachProfile", id: coachB.profile.id },
      { table: "user", id: coachA.user.id },
      { table: "user", id: coachB.user.id },
    );
  });

  describe("create", () => {
    it("attaches the credential to the caller's own coach profile", async () => {
      const credential = await coachingCoachCredentialApi.create(coachA.user.id, {
        title: "L1 Trainer",
        issuer: "CrossFit",
        year: 2020,
        shownToAthletes: true,
      });

      createdCredentialIds.push(credential.id);

      expect(credential.coachProfileId).toBe(coachA.profile.id);
      expect(credential.title).toBe("L1 Trainer");
    });

    it("rejects a year beyond the current year", async () => {
      await expect(
        coachingCoachCredentialApi.create(coachA.user.id, {
          title: "Future Cert",
          issuer: "CrossFit",
          year: new Date().getFullYear() + 1,
          shownToAthletes: true,
        }),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("update", () => {
    it("updates the caller's own credential", async () => {
      const credential = await coachingCoachCredentialApi.create(coachA.user.id, {
        title: "L2 Trainer",
        issuer: "CrossFit",
        year: 2021,
        shownToAthletes: true,
      });

      createdCredentialIds.push(credential.id);

      const updated = await coachingCoachCredentialApi.update(coachA.user.id, credential.id, {
        title: "L3 Trainer",
        shownToAthletes: false,
      });

      expect(updated.title).toBe("L3 Trainer");
      expect(updated.shownToAthletes).toBe(false);
    });

    it("throws NotFoundError when updating another coach's credential", async () => {
      await expect(
        coachingCoachCredentialApi.update(coachA.user.id, coachBCredential.id, {
          title: "Hijacked",
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("removes the caller's own credential", async () => {
      const credential = await coachingCoachCredentialApi.create(coachA.user.id, {
        title: "Temporary Cert",
        issuer: "CrossFit",
        year: 2019,
        shownToAthletes: true,
      });

      await coachingCoachCredentialApi.delete(coachA.user.id, credential.id);

      const found = await cleanupRaw.coachCredential.findUnique({ where: { id: credential.id } });

      expect(found).toBeNull();
    });

    it("throws NotFoundError when deleting another coach's credential", async () => {
      await expect(
        coachingCoachCredentialApi.delete(coachA.user.id, coachBCredential.id),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
