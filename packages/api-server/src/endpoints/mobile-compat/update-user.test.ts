import { afterAll, describe, expect, it } from "vitest";

import type { LegacyShimIdentity } from "@repo/api-routes/legacy-shim";

import {
  cleanupRaw,
  createTestLegacyIdentity,
  createTestUser,
  mintTestLegacyUserId,
} from "../../test/helpers";

import { createUpdateUserApi } from "./update-user";
import { updateUserRequestSchema } from "./wire-schemas";

const api = createUpdateUserApi();

const createdUserIds: string[] = [];

const seedAthlete = async (): Promise<{ identity: LegacyShimIdentity; email: string }> => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `shim-updateuser-${suffix}@test.local`;
  const user = await createTestUser({ email });

  createdUserIds.push(user.id);

  const legacyUserId = mintTestLegacyUserId();

  await createTestLegacyIdentity(user.id, {
    legacyUserId,
    legacyRoleId: 2,
    legacyPlanId: 2,
    legacyLevelId: 2,
    isEnabled: true,
    firstName: "Denys",
    lastName: "Sergeev",
    phoneNumber: "+10000000000",
    dateOfBirth: new Date("1980-01-01T00:00:00.000Z"),
  });

  return {
    identity: { userId: user.id, legacyUserId, legacyRoleId: 2, legacyPlanId: 2, legacyLevelId: 2 },
    email,
  };
};

describe("mobile shim update user", () => {
  afterAll(async () => {
    await cleanupRaw.mobileLegacyIdentity.deleteMany({ where: { userId: { in: createdUserIds } } });
    await cleanupRaw.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  it("persists only the four editable fields, ignoring privilege fields the body carries", async () => {
    const { identity, email } = await seedAthlete();

    const input = updateUserRequestSchema.parse({
      id: identity.legacyUserId,
      firstName: "A",
      lastName: "B",
      phoneNumber: "555",
      dateOfBirth: "1990-05-01",
      userRole: { id: 1, name: "USER" },
      isEnabled: false,
      trainingLevel: { id: 1, name: "Scaled" },
      userPlan: { id: 1, name: "General" },
      username: "hacker@evil.local",
    });

    expect(await api.updateUser(identity, input)).toEqual({
      kind: "ok-json",
      payload: {
        id: identity.legacyUserId,
        isEnabled: true,
        username: email,
        userRole: { id: 2, name: "ADMIN" },
        userPlan: { id: 2, name: "Individual" },
        trainingLevel: { id: 2, name: "Pro" },
        firstName: "A",
        lastName: "B",
        phoneNumber: "555",
        dateOfBirth: "1990-05-01",
        team: null,
      },
    });

    const row = await cleanupRaw.mobileLegacyIdentity.findUnique({
      where: { userId: identity.userId },
    });

    expect(row?.legacyRoleId).toBe(2);
    expect(row?.legacyPlanId).toBe(2);
    expect(row?.legacyLevelId).toBe(2);
    expect(row?.isEnabled).toBe(true);
    expect(row?.firstName).toBe("A");
    expect(row?.dateOfBirth?.toISOString().slice(0, 10)).toBe("1990-05-01");
  });

  it("stores a null date of birth as null", async () => {
    const { identity } = await seedAthlete();

    await api.updateUser(
      identity,
      updateUserRequestSchema.parse({ id: identity.legacyUserId, dateOfBirth: null }),
    );

    const row = await cleanupRaw.mobileLegacyIdentity.findUnique({
      where: { userId: identity.userId },
    });

    expect(row?.dateOfBirth).toBeNull();
  });

  it("returns not-found for a foreign id and writes nothing, never a 403", async () => {
    const { identity } = await seedAthlete();

    expect(
      await api.updateUser(
        identity,
        updateUserRequestSchema.parse({ id: identity.legacyUserId + 1, firstName: "X" }),
      ),
    ).toEqual({ kind: "not-found" });

    const row = await cleanupRaw.mobileLegacyIdentity.findUnique({
      where: { userId: identity.userId },
    });

    expect(row?.firstName).toBe("Denys");
  });
});
