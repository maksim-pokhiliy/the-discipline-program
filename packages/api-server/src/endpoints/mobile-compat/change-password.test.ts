import { afterAll, describe, expect, it } from "vitest";

import { type LegacyShimIdentity, renderLegacyUserOutcome } from "@repo/api-routes/legacy-shim";

import { GOLDEN_BCRYPT_HASH, GOLDEN_PASSWORD } from "../../test/golden-fixture";
import {
  cleanupRaw,
  createTestLegacyIdentity,
  createTestUser,
  mintTestLegacyUserId,
} from "../../test/helpers";
import { iamAuthService } from "../iam/auth-service";

import { createChangePasswordApi } from "./change-password";

const api = createChangePasswordApi();

const createdUserIds: string[] = [];

const NEW_PASSWORD = "NewPassw0rd!23";
const STRONG_PASSWORD = "Str0ngPassw0rd!";
const SEED_TOKEN_VERSION = 5;

const seedUser = async (
  options: { password?: string | null; tokenVersion?: number } = {},
): Promise<{ identity: LegacyShimIdentity }> => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `shim-chpw-${suffix}@test.local`;
  const user = await createTestUser({
    email,
    tokenVersion: options.tokenVersion ?? SEED_TOKEN_VERSION,
    password: options.password ?? null,
  });

  createdUserIds.push(user.id);

  const legacyUserId = mintTestLegacyUserId();

  await createTestLegacyIdentity(user.id, {
    legacyUserId,
    legacyRoleId: 1,
    legacyPlanId: 1,
    legacyLevelId: 2,
    isEnabled: true,
  });

  return {
    identity: { userId: user.id, legacyUserId, legacyRoleId: 1, legacyPlanId: 1, legacyLevelId: 2 },
  };
};

describe("mobile shim change password", () => {
  afterAll(async () => {
    await cleanupRaw.mobileLegacyIdentity.deleteMany({ where: { userId: { in: createdUserIds } } });
    await cleanupRaw.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  it("rejects a new password below the platform minimum with bad-request", async () => {
    const { identity } = await seedUser({ password: GOLDEN_BCRYPT_HASH });

    expect(
      await api.changePassword(identity, {
        userId: identity.legacyUserId,
        oldPassword: GOLDEN_PASSWORD,
        newPassword: "abc",
      }),
    ).toEqual({ kind: "bad-request" });
  });

  it("returns not-found for a foreign userId and changes nothing", async () => {
    const { identity } = await seedUser({ password: GOLDEN_BCRYPT_HASH });

    expect(
      await api.changePassword(identity, {
        userId: identity.legacyUserId + 1,
        oldPassword: GOLDEN_PASSWORD,
        newPassword: NEW_PASSWORD,
      }),
    ).toEqual({ kind: "not-found" });

    const row = await cleanupRaw.user.findUnique({
      where: { id: identity.userId },
      select: { password: true },
    });

    expect(row?.password).toBe(GOLDEN_BCRYPT_HASH);
  });

  it("rejects a wrong old password with 401, never the 403 that signs the athlete out", async () => {
    const { identity } = await seedUser({ password: GOLDEN_BCRYPT_HASH });

    const outcome = await api.changePassword(identity, {
      userId: identity.legacyUserId,
      oldPassword: "WrongButLong123!",
      newPassword: NEW_PASSWORD,
    });

    expect(outcome.kind).toBe("unauthorized");

    const response = renderLegacyUserOutcome(outcome);

    expect(response.status).toBe(401);
    expect(response.status).not.toBe(403);
  });

  it("treats a user with no local credential as unauthorized without throwing", async () => {
    const { identity } = await seedUser({ password: null });

    expect(
      await api.changePassword(identity, {
        userId: identity.legacyUserId,
        oldPassword: GOLDEN_PASSWORD,
        newPassword: NEW_PASSWORD,
      }),
    ).toEqual({ kind: "unauthorized" });
  });

  it("rejects a new password identical to the old with bad-request", async () => {
    const hash = await iamAuthService.hashPassword(STRONG_PASSWORD);
    const { identity } = await seedUser({ password: hash });

    expect(
      await api.changePassword(identity, {
        userId: identity.legacyUserId,
        oldPassword: STRONG_PASSWORD,
        newPassword: STRONG_PASSWORD,
      }),
    ).toEqual({ kind: "bad-request" });
  });

  it("changes the password, bumps tokenVersion, and returns 200-empty", async () => {
    const { identity } = await seedUser({
      password: GOLDEN_BCRYPT_HASH,
      tokenVersion: SEED_TOKEN_VERSION,
    });

    const outcome = await api.changePassword(identity, {
      userId: identity.legacyUserId,
      oldPassword: GOLDEN_PASSWORD,
      newPassword: NEW_PASSWORD,
    });

    expect(outcome).toEqual({ kind: "ok-empty" });

    const updated = await cleanupRaw.user.findUnique({
      where: { id: identity.userId },
      select: { password: true, tokenVersion: true },
    });

    if (!updated || updated.password === null) {
      throw new Error("expected the updated user to still have a password");
    }

    expect(updated.tokenVersion).toBe(SEED_TOKEN_VERSION + 1);
    expect(await iamAuthService.comparePassword(NEW_PASSWORD, updated.password)).toBe(true);

    const response = renderLegacyUserOutcome(outcome);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
  });
});
