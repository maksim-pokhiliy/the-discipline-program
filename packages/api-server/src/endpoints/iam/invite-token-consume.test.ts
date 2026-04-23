import crypto from "node:crypto";

import bcrypt from "bcryptjs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { ROLE_HOMES, UserRole } from "@repo/contracts/iam/auth";
import { GoneError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { cleanup, cleanupRaw, createTestUser } from "../../test/helpers";

import { iamInviteTokenApi } from "./invite-token";

const hashToken = (plainToken: string): string =>
  crypto.createHash("sha256").update(plainToken).digest("hex");

const testPassword = "valid-password-with-enough-length";

describe("iamInviteTokenApi.consume", () => {
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;
  let targetUser: Awaited<ReturnType<typeof createTestUser>>;
  let coachUser: Awaited<ReturnType<typeof createTestUser>>;
  let softDeletedUser: Awaited<ReturnType<typeof createTestUser>>;

  const issuedTokenIds: string[] = [];

  beforeAll(async () => {
    adminUser = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
    targetUser = await createTestUser();
    coachUser = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.COACH] });
    softDeletedUser = await createTestUser();
  });

  afterAll(async () => {
    for (const id of issuedTokenIds) {
      await cleanupRaw.userInviteToken.delete({ where: { id } }).catch(() => undefined);
    }

    await cleanupRaw.userInviteToken
      .deleteMany({
        where: { userId: { in: [targetUser.id, coachUser.id, softDeletedUser.id] } },
      })
      .catch(() => undefined);

    await cleanup(
      { table: "user", id: adminUser.id },
      { table: "user", id: targetUser.id },
      { table: "user", id: coachUser.id },
      { table: "user", id: softDeletedUser.id },
    );
  });

  beforeEach(async () => {
    await cleanupRaw.userInviteToken.deleteMany({
      where: { userId: { in: [targetUser.id, coachUser.id, softDeletedUser.id] } },
    });
    await cleanupRaw.user.update({
      where: { id: targetUser.id },
      data: { password: null, emailVerified: null, timezone: "UTC", tokenVersion: 0 },
    });
    await cleanupRaw.user.update({
      where: { id: coachUser.id },
      data: { password: null, emailVerified: null, timezone: "UTC", tokenVersion: 0 },
    });
  });

  it("sets password, bumps tokenVersion, sets emailVerified, marks token consumed, returns { email, redirectTo }", async () => {
    const { plainToken } = await iamInviteTokenApi.issue({
      userId: targetUser.id,
      createdByAdminId: adminUser.id,
    });
    const before = await cleanupRaw.user.findUnique({ where: { id: targetUser.id } });
    const result = await iamInviteTokenApi.consume(plainToken, { password: testPassword });

    expect(result.email).toBe(targetUser.email);
    expect(result.redirectTo).toBe(ROLE_HOMES[UserRole.ATHLETE]);

    const after = await cleanupRaw.user.findUnique({ where: { id: targetUser.id } });
    const tokenAfter = await cleanupRaw.userInviteToken.findUnique({
      where: { tokenHash: hashToken(plainToken) },
    });

    expect(after?.password).not.toBeNull();

    if (after?.password) {
      const matches = await bcrypt.compare(testPassword, after.password);

      expect(matches).toBe(true);
    }

    expect(after?.emailVerified).not.toBeNull();
    expect(after?.tokenVersion).toBe((before?.tokenVersion ?? 0) + 1);
    expect(tokenAfter?.consumedAt).not.toBeNull();

    if (tokenAfter) {
      issuedTokenIds.push(tokenAfter.id);
    }
  });

  it("returns role-specific redirectTo for a COACH", async () => {
    const { plainToken } = await iamInviteTokenApi.issue({
      userId: coachUser.id,
      createdByAdminId: adminUser.id,
    });
    const result = await iamInviteTokenApi.consume(plainToken, { password: testPassword });

    expect(result.redirectTo).toBe(ROLE_HOMES[UserRole.COACH]);

    const tokenRow = await cleanupRaw.userInviteToken.findUnique({
      where: { tokenHash: hashToken(plainToken) },
    });

    if (tokenRow) {
      issuedTokenIds.push(tokenRow.id);
    }
  });

  it("persists timezone when supplied", async () => {
    const { plainToken } = await iamInviteTokenApi.issue({
      userId: targetUser.id,
      createdByAdminId: adminUser.id,
    });

    await iamInviteTokenApi.consume(plainToken, {
      password: testPassword,
      timezone: "Europe/Kiev",
    });

    const after = await cleanupRaw.user.findUnique({ where: { id: targetUser.id } });

    expect(after?.timezone).toBe("Europe/Kiev");

    const tokenRow = await cleanupRaw.userInviteToken.findUnique({
      where: { tokenHash: hashToken(plainToken) },
    });

    if (tokenRow) {
      issuedTokenIds.push(tokenRow.id);
    }
  });

  it("leaves user.timezone unchanged when timezone is not provided", async () => {
    await cleanupRaw.user.update({
      where: { id: targetUser.id },
      data: { timezone: "America/New_York" },
    });

    const { plainToken } = await iamInviteTokenApi.issue({
      userId: targetUser.id,
      createdByAdminId: adminUser.id,
    });

    await iamInviteTokenApi.consume(plainToken, { password: testPassword });

    const after = await cleanupRaw.user.findUnique({ where: { id: targetUser.id } });

    expect(after?.timezone).toBe("America/New_York");

    const tokenRow = await cleanupRaw.userInviteToken.findUnique({
      where: { tokenHash: hashToken(plainToken) },
    });

    if (tokenRow) {
      issuedTokenIds.push(tokenRow.id);
    }
  });

  it("throws GoneError for an expired token", async () => {
    const plainToken = crypto.randomBytes(32).toString("base64url");
    const row = await cleanupRaw.userInviteToken.create({
      data: {
        userId: targetUser.id,
        tokenHash: hashToken(plainToken),
        expiresAt: new Date(Date.now() - 60_000),
        createdByAdminId: adminUser.id,
      },
    });

    issuedTokenIds.push(row.id);

    await expect(iamInviteTokenApi.consume(plainToken, { password: testPassword })).rejects.toThrow(
      GoneError,
    );
  });

  it("throws GoneError for an already consumed token", async () => {
    const plainToken = crypto.randomBytes(32).toString("base64url");
    const row = await cleanupRaw.userInviteToken.create({
      data: {
        userId: targetUser.id,
        tokenHash: hashToken(plainToken),
        expiresAt: new Date(Date.now() + 3_600_000),
        consumedAt: new Date(),
        createdByAdminId: adminUser.id,
      },
    });

    issuedTokenIds.push(row.id);

    await expect(iamInviteTokenApi.consume(plainToken, { password: testPassword })).rejects.toThrow(
      GoneError,
    );
  });

  it("throws GoneError for a non-existent token", async () => {
    const fakeToken = crypto.randomBytes(32).toString("base64url");

    await expect(iamInviteTokenApi.consume(fakeToken, { password: testPassword })).rejects.toThrow(
      GoneError,
    );
  });

  it("throws GoneError when target user is soft-deleted", async () => {
    const { plainToken } = await iamInviteTokenApi.issue({
      userId: softDeletedUser.id,
      createdByAdminId: adminUser.id,
    });

    await cleanupRaw.user.update({
      where: { id: softDeletedUser.id },
      data: {
        deletedAt: new Date(),
        email: `${softDeletedUser.email}_deleted_${Date.now()}`,
      },
    });

    await expect(iamInviteTokenApi.consume(plainToken, { password: testPassword })).rejects.toThrow(
      GoneError,
    );

    await cleanupRaw.user.update({
      where: { id: softDeletedUser.id },
      data: { deletedAt: null, email: softDeletedUser.email },
    });

    const row = await cleanupRaw.userInviteToken.findUnique({
      where: { tokenHash: hashToken(plainToken) },
    });

    if (row) {
      issuedTokenIds.push(row.id);
    }
  });

  it("is idempotent under concurrent consume (C5 fix): only one succeeds, the other throws GoneError", async () => {
    const { plainToken } = await iamInviteTokenApi.issue({
      userId: targetUser.id,
      createdByAdminId: adminUser.id,
    });
    const results = await Promise.allSettled([
      iamInviteTokenApi.consume(plainToken, { password: "first-password-long-enough" }),
      iamInviteTokenApi.consume(plainToken, { password: "second-password-long-enough" }),
    ]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const rejection = rejected[0];

    if (rejection && rejection.status === "rejected") {
      expect(rejection.reason).toBeInstanceOf(GoneError);
    }

    const tokenRow = await cleanupRaw.userInviteToken.findUnique({
      where: { tokenHash: hashToken(plainToken) },
    });

    expect(tokenRow?.consumedAt).not.toBeNull();

    if (tokenRow) {
      issuedTokenIds.push(tokenRow.id);
    }
  });

  it("serial double-submit on a consumed token throws GoneError", async () => {
    const { plainToken } = await iamInviteTokenApi.issue({
      userId: targetUser.id,
      createdByAdminId: adminUser.id,
    });

    await iamInviteTokenApi.consume(plainToken, { password: testPassword });

    await expect(
      iamInviteTokenApi.consume(plainToken, { password: "another-password-please" }),
    ).rejects.toThrow(GoneError);

    const tokenRow = await cleanupRaw.userInviteToken.findUnique({
      where: { tokenHash: hashToken(plainToken) },
    });

    if (tokenRow) {
      issuedTokenIds.push(tokenRow.id);
    }
  });
});
