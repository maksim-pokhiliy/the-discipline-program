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

describe("iamInviteTokenApi", () => {
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

  describe("issue & validate", () => {
    beforeEach(async () => {
      await cleanupRaw.userInviteToken.deleteMany({
        where: { userId: { in: [targetUser.id, softDeletedUser.id] } },
      });
    });

    describe("issue", () => {
      it("creates token row with hashed token (not plaintext) and returns plain token + expiresAt", async () => {
        const before = Date.now();
        const { plainToken, expiresAt } = await iamInviteTokenApi.issue({
          userId: targetUser.id,
          createdByAdminId: adminUser.id,
        });
        const tokenHash = hashToken(plainToken);
        const row = await cleanupRaw.userInviteToken.findUnique({ where: { tokenHash } });

        expect(row).not.toBeNull();
        expect(row?.tokenHash).toBe(tokenHash);
        expect(row?.tokenHash).not.toBe(plainToken);
        expect(row?.userId).toBe(targetUser.id);
        expect(row?.createdByAdminId).toBe(adminUser.id);
        expect(row?.consumedAt).toBeNull();
        expect(expiresAt.getTime()).toBeGreaterThan(before);

        if (row) {
          issuedTokenIds.push(row.id);
        }
      });

      it("produces a base64url plaintext with at least 32 bytes of entropy", async () => {
        const { plainToken } = await iamInviteTokenApi.issue({
          userId: targetUser.id,
          createdByAdminId: adminUser.id,
        });

        expect(plainToken).toMatch(/^[A-Za-z0-9_-]+$/);

        const decodedBytes = Buffer.from(plainToken, "base64url").length;

        expect(decodedBytes).toBeGreaterThanOrEqual(32);

        const row = await cleanupRaw.userInviteToken.findUnique({
          where: { tokenHash: hashToken(plainToken) },
        });

        if (row) {
          issuedTokenIds.push(row.id);
        }
      });

      it("marks the prior unconsumed token as consumed when issuing a new one", async () => {
        const first = await iamInviteTokenApi.issue({
          userId: targetUser.id,
          createdByAdminId: adminUser.id,
        });
        const second = await iamInviteTokenApi.issue({
          userId: targetUser.id,
          createdByAdminId: adminUser.id,
        });
        const firstRow = await cleanupRaw.userInviteToken.findUnique({
          where: { tokenHash: hashToken(first.plainToken) },
        });
        const secondRow = await cleanupRaw.userInviteToken.findUnique({
          where: { tokenHash: hashToken(second.plainToken) },
        });

        expect(firstRow?.consumedAt).not.toBeNull();
        expect(secondRow?.consumedAt).toBeNull();

        if (firstRow) {
          issuedTokenIds.push(firstRow.id);
        }

        if (secondRow) {
          issuedTokenIds.push(secondRow.id);
        }
      });

      it("uses INVITE_TOKEN_TTL_HOURS env default when ttlHours is omitted", async () => {
        const before = Date.now();
        const { plainToken, expiresAt } = await iamInviteTokenApi.issue({
          userId: targetUser.id,
          createdByAdminId: adminUser.id,
        });
        const diffHours = (expiresAt.getTime() - before) / 3_600_000;

        expect(diffHours).toBeGreaterThanOrEqual(71.9);
        expect(diffHours).toBeLessThanOrEqual(72.1);

        const row = await cleanupRaw.userInviteToken.findUnique({
          where: { tokenHash: hashToken(plainToken) },
        });

        if (row) {
          issuedTokenIds.push(row.id);
        }
      });

      it("honors explicit ttlHours override", async () => {
        const before = Date.now();
        const { plainToken, expiresAt } = await iamInviteTokenApi.issue({
          userId: targetUser.id,
          createdByAdminId: adminUser.id,
          ttlHours: 1,
        });
        const diffHours = (expiresAt.getTime() - before) / 3_600_000;

        expect(diffHours).toBeGreaterThan(0.9);
        expect(diffHours).toBeLessThan(1.1);

        const row = await cleanupRaw.userInviteToken.findUnique({
          where: { tokenHash: hashToken(plainToken) },
        });

        if (row) {
          issuedTokenIds.push(row.id);
        }
      });
    });

    describe("validate", () => {
      it("returns { email, recipientName, expiresAt } for a valid token", async () => {
        const { plainToken, expiresAt } = await iamInviteTokenApi.issue({
          userId: targetUser.id,
          createdByAdminId: adminUser.id,
        });
        const result = await iamInviteTokenApi.validate(plainToken);

        expect(result.email).toBe(targetUser.email);
        expect(result.recipientName).toBe(targetUser.name);
        expect(result.expiresAt.getTime()).toBe(expiresAt.getTime());

        const row = await cleanupRaw.userInviteToken.findUnique({
          where: { tokenHash: hashToken(plainToken) },
        });

        if (row) {
          issuedTokenIds.push(row.id);
        }
      });

      it("throws GoneError for a non-existent token", async () => {
        const fakeToken = crypto.randomBytes(32).toString("base64url");

        await expect(iamInviteTokenApi.validate(fakeToken)).rejects.toThrow(GoneError);
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

        await expect(iamInviteTokenApi.validate(plainToken)).rejects.toThrow(GoneError);
      });

      it("throws GoneError for a consumed token", async () => {
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

        await expect(iamInviteTokenApi.validate(plainToken)).rejects.toThrow(GoneError);
      });

      it("throws GoneError with generic message for a token whose user is soft-deleted (C2 fix)", async () => {
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

        await expect(iamInviteTokenApi.validate(plainToken)).rejects.toThrow(GoneError);

        try {
          await iamInviteTokenApi.validate(plainToken);
        } catch (error) {
          if (error instanceof GoneError) {
            expect(error.message).not.toContain("_deleted_");
            expect(error.message).not.toContain(softDeletedUser.email);
          }
        }

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

      it("emits the same generic GoneError message regardless of invalidation reason", async () => {
        const fakeToken = crypto.randomBytes(32).toString("base64url");
        const plainExpired = crypto.randomBytes(32).toString("base64url");
        const expiredRow = await cleanupRaw.userInviteToken.create({
          data: {
            userId: targetUser.id,
            tokenHash: hashToken(plainExpired),
            expiresAt: new Date(Date.now() - 60_000),
            createdByAdminId: adminUser.id,
          },
        });

        issuedTokenIds.push(expiredRow.id);

        const plainConsumed = crypto.randomBytes(32).toString("base64url");
        const consumedRow = await cleanupRaw.userInviteToken.create({
          data: {
            userId: targetUser.id,
            tokenHash: hashToken(plainConsumed),
            expiresAt: new Date(Date.now() + 3_600_000),
            consumedAt: new Date(),
            createdByAdminId: adminUser.id,
          },
        });

        issuedTokenIds.push(consumedRow.id);

        const notFoundMessage = await iamInviteTokenApi
          .validate(fakeToken)
          .catch((e: unknown) => (e instanceof GoneError ? e.message : null));
        const expiredMessage = await iamInviteTokenApi
          .validate(plainExpired)
          .catch((e: unknown) => (e instanceof GoneError ? e.message : null));
        const consumedMessage = await iamInviteTokenApi
          .validate(plainConsumed)
          .catch((e: unknown) => (e instanceof GoneError ? e.message : null));

        expect(notFoundMessage).not.toBeNull();
        expect(expiredMessage).toBe(notFoundMessage);
        expect(consumedMessage).toBe(notFoundMessage);
      });
    });
  });

  describe("consume", () => {
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

      await expect(
        iamInviteTokenApi.consume(plainToken, { password: testPassword }),
      ).rejects.toThrow(GoneError);
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

      await expect(
        iamInviteTokenApi.consume(plainToken, { password: testPassword }),
      ).rejects.toThrow(GoneError);
    });

    it("throws GoneError for a non-existent token", async () => {
      const fakeToken = crypto.randomBytes(32).toString("base64url");

      await expect(
        iamInviteTokenApi.consume(fakeToken, { password: testPassword }),
      ).rejects.toThrow(GoneError);
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

      await expect(
        iamInviteTokenApi.consume(plainToken, { password: testPassword }),
      ).rejects.toThrow(GoneError);

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
});
