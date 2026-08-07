import { afterAll, describe, expect, it } from "vitest";

import { GOLDEN_BCRYPT_HASH, GOLDEN_PASSWORD } from "../../test/golden-fixture";
import { cleanupRaw, createTestLegacyIdentity, createTestUser } from "../../test/helpers";

import { resolveMobileShimIdentity } from "./identity-resolver";
import { signMobileShimToken } from "./shim-token";
import { createSigninApi } from "./signin";

const api = createSigninApi();

type Seeded = { userId: string; email: string; legacyUserId: number };

const createdUserIds: string[] = [];

const seedUser = async (options: {
  isEnabled?: boolean;
  withIdentity?: boolean;
  legacyRoleId?: number;
  legacyPlanId?: number;
}): Promise<Seeded> => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const email = `shim-${suffix}@test.local`;
  const user = await createTestUser({ email, password: GOLDEN_BCRYPT_HASH });

  createdUserIds.push(user.id);

  const legacyUserId = Math.floor(Math.random() * 900_000) + 2_000_000;

  if (options.withIdentity !== false) {
    await createTestLegacyIdentity(user.id, {
      legacyUserId,
      legacyRoleId: options.legacyRoleId ?? 1,
      legacyPlanId: options.legacyPlanId ?? 1,
      legacyLevelId: 2,
      isEnabled: options.isEnabled ?? true,
    });
  }

  return { userId: user.id, email, legacyUserId };
};

describe("mobile shim signin", () => {
  afterAll(async () => {
    await cleanupRaw.mobileLegacyIdentity.deleteMany({
      where: { userId: { in: createdUserIds } },
    });
    await cleanupRaw.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  it("returns the legacy integer id, not the platform cuid, so the Swift decode survives", async () => {
    const seeded = await seedUser({});

    const result = await api.signin({ username: seeded.email, password: GOLDEN_PASSWORD });

    expect(result.kind).toBe("ok");

    if (result.kind !== "ok") {
      return;
    }

    expect(result.payload.userId).toBe(seeded.legacyUserId);
    expect(typeof result.payload.userId).toBe("number");
    expect(result.payload.accessToken).toEqual(expect.any(String));
  });

  it("resolves the catalog names from the legacy ids", async () => {
    const seeded = await seedUser({ legacyRoleId: 2, legacyPlanId: 2 });

    const result = await api.signin({ username: seeded.email, password: GOLDEN_PASSWORD });

    expect(result).toMatchObject({
      kind: "ok",
      payload: {
        userRole: { id: 2, name: "ADMIN" },
        userPlan: { id: 2, name: "Individual" },
      },
    });
  });

  it("accepts an uppercase email because the legacy stack lowercases before lookup", async () => {
    const seeded = await seedUser({});

    const result = await api.signin({
      username: seeded.email.toUpperCase(),
      password: GOLDEN_PASSWORD,
    });

    expect(result.kind).toBe("ok");
  });

  it("denies a wrong password", async () => {
    const seeded = await seedUser({});

    expect(await api.signin({ username: seeded.email, password: "wrong" })).toEqual({
      kind: "denied",
    });
  });

  it("denies an unknown user", async () => {
    expect(await api.signin({ username: "nobody@test.local", password: GOLDEN_PASSWORD })).toEqual({
      kind: "denied",
    });
  });

  it("denies a disabled identity", async () => {
    const seeded = await seedUser({ isEnabled: false });

    expect(await api.signin({ username: seeded.email, password: GOLDEN_PASSWORD })).toEqual({
      kind: "denied",
    });
  });

  it("denies a user with no legacy identity row", async () => {
    const seeded = await seedUser({ withIdentity: false });

    expect(await api.signin({ username: seeded.email, password: GOLDEN_PASSWORD })).toEqual({
      kind: "denied",
    });
  });

  it("denies a soft-deleted user", async () => {
    const seeded = await seedUser({});

    await cleanupRaw.user.update({
      where: { id: seeded.userId },
      data: { deletedAt: new Date() },
    });

    expect(await api.signin({ username: seeded.email, password: GOLDEN_PASSWORD })).toEqual({
      kind: "denied",
    });
  });
});

describe("mobile shim identity resolver", () => {
  afterAll(async () => {
    await cleanupRaw.mobileLegacyIdentity.deleteMany({
      where: { userId: { in: createdUserIds } },
    });
    await cleanupRaw.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  it("authenticates a valid token", async () => {
    const seeded = await seedUser({});
    const token = await signMobileShimToken({
      sub: seeded.userId,
      legacyUserId: seeded.legacyUserId,
      tokenVersion: 0,
    });

    expect(await resolveMobileShimIdentity(token)).toEqual({
      kind: "authenticated",
      identity: {
        userId: seeded.userId,
        legacyUserId: seeded.legacyUserId,
        legacyRoleId: 1,
        legacyPlanId: 1,
        legacyLevelId: 2,
      },
    });
  });

  it("denies a token whose tokenVersion no longer matches the user", async () => {
    const seeded = await seedUser({});
    const token = await signMobileShimToken({
      sub: seeded.userId,
      legacyUserId: seeded.legacyUserId,
      tokenVersion: 0,
    });

    await cleanupRaw.user.update({
      where: { id: seeded.userId },
      data: { tokenVersion: { increment: 1 } },
    });

    expect(await resolveMobileShimIdentity(token)).toEqual({ kind: "denied" });
  });

  it("denies a soft-deleted user holding a still-valid token", async () => {
    const seeded = await seedUser({});
    const token = await signMobileShimToken({
      sub: seeded.userId,
      legacyUserId: seeded.legacyUserId,
      tokenVersion: 0,
    });

    await cleanupRaw.user.update({
      where: { id: seeded.userId },
      data: { deletedAt: new Date() },
    });

    expect(await resolveMobileShimIdentity(token)).toEqual({ kind: "denied" });
  });

  it("denies a disabled identity holding a still-valid token", async () => {
    const seeded = await seedUser({});
    const token = await signMobileShimToken({
      sub: seeded.userId,
      legacyUserId: seeded.legacyUserId,
      tokenVersion: 0,
    });

    await cleanupRaw.mobileLegacyIdentity.update({
      where: { userId: seeded.userId },
      data: { isEnabled: false },
    });

    expect(await resolveMobileShimIdentity(token)).toEqual({ kind: "denied" });
  });

  it("denies a garbage token", async () => {
    expect(await resolveMobileShimIdentity("garbage")).toEqual({ kind: "denied" });
  });
});
