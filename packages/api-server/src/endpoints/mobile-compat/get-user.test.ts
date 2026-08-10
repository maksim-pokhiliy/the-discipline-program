import { afterAll, describe, expect, it } from "vitest";

import type { LegacyShimIdentity } from "@repo/api-routes/legacy-shim";
import { InternalServerError } from "@repo/errors";

import { GOLDEN_BCRYPT_HASH } from "../../test/golden-fixture";
import {
  cleanupRaw,
  createTestLegacyIdentity,
  createTestUser,
  mintTestLegacyUserId,
} from "../../test/helpers";

import { createGetUserApi } from "./get-user";

const api = createGetUserApi();

const createdUserIds: string[] = [];

const DATE_OF_BIRTH_ISO = "1990-05-01";

const seedAthlete = async (
  options: { legacyRoleId?: number; legacyPlanId?: number; legacyLevelId?: number } = {},
): Promise<{ identity: LegacyShimIdentity; email: string }> => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `shim-getuser-${suffix}@test.local`;
  const user = await createTestUser({ email, password: GOLDEN_BCRYPT_HASH });

  createdUserIds.push(user.id);

  const legacyUserId = mintTestLegacyUserId();
  const legacyRoleId = options.legacyRoleId ?? 1;
  const legacyPlanId = options.legacyPlanId ?? 1;
  const legacyLevelId = options.legacyLevelId ?? 2;

  await createTestLegacyIdentity(user.id, {
    legacyUserId,
    legacyRoleId,
    legacyPlanId,
    legacyLevelId,
    isEnabled: true,
    firstName: "Denys",
    lastName: "Sergeev",
    phoneNumber: "+15551234567",
    dateOfBirth: new Date(`${DATE_OF_BIRTH_ISO}T00:00:00.000Z`),
  });

  return {
    identity: { userId: user.id, legacyUserId, legacyRoleId, legacyPlanId, legacyLevelId },
    email,
  };
};

describe("mobile shim get user", () => {
  afterAll(async () => {
    await cleanupRaw.mobileLegacyIdentity.deleteMany({ where: { userId: { in: createdUserIds } } });
    await cleanupRaw.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  it("serves the athlete's own record as a fully assembled dto", async () => {
    const { identity, email } = await seedAthlete();

    expect(await api.getUser(identity, identity.legacyUserId)).toEqual({
      kind: "ok-json",
      payload: {
        id: identity.legacyUserId,
        isEnabled: true,
        username: email,
        userRole: { id: 1, name: "USER" },
        userPlan: { id: 1, name: "General" },
        trainingLevel: { id: 2, name: "Pro" },
        firstName: "Denys",
        lastName: "Sergeev",
        phoneNumber: "+15551234567",
        dateOfBirth: "1990-05-01",
        team: null,
      },
    });
  });

  it("returns not-found for another athlete's id, never a 403 that signs the caller out", async () => {
    const { identity } = await seedAthlete();

    expect(await api.getUser(identity, identity.legacyUserId + 1)).toEqual({ kind: "not-found" });
  });

  it("throws a 500-path error rather than denying when a catalog id is unmapped", async () => {
    const { identity } = await seedAthlete({ legacyRoleId: 77 });

    await expect(api.getUser(identity, identity.legacyUserId)).rejects.toThrow(InternalServerError);
  });

  it("returns not-found for a soft-deleted user instead of a stale read", async () => {
    const { identity } = await seedAthlete();

    await cleanupRaw.user.update({
      where: { id: identity.userId },
      data: { deletedAt: new Date() },
    });

    expect(await api.getUser(identity, identity.legacyUserId)).toEqual({ kind: "not-found" });
  });
});
