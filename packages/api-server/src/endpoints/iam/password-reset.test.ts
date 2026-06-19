import crypto from "node:crypto";

import bcrypt from "bcryptjs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { GoneError } from "@repo/errors";

import { cleanup, cleanupRaw, createTestUser } from "../../test/helpers";

import { iamPasswordResetApi } from "./password-reset";

const hashToken = (plainToken: string): string =>
  crypto.createHash("sha256").update(plainToken).digest("hex");

const generatePlainToken = (): string => crypto.randomBytes(32).toString("base64url");

const MS_PER_HOUR = 3_600_000;
const PAST_OFFSET_MS = 60_000;
const FUTURE_OFFSET_MS = MS_PER_HOUR;
const FIXED_PAST_VERIFIED = new Date("2020-01-01T00:00:00.000Z");

const testPassword = "valid-password-with-enough-length";

const issueViaRequest = async (email: string): Promise<{ row: { id: string }; plain: string }> => {
  await iamPasswordResetApi.request(email);

  const row = await cleanupRaw.passwordResetToken.findFirst({
    where: { user: { email: email.toLowerCase().trim() }, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!row) {
    throw new Error(`expected a reset token row for ${email}`);
  }

  const plain = generatePlainToken();

  await cleanupRaw.passwordResetToken.update({
    where: { id: row.id },
    data: { tokenHash: hashToken(plain) },
  });

  return { row, plain };
};

describe("iamPasswordResetApi", () => {
  let targetUser: Awaited<ReturnType<typeof createTestUser>>;
  let secondUser: Awaited<ReturnType<typeof createTestUser>>;
  let softDeletedUser: Awaited<ReturnType<typeof createTestUser>>;
  let canonicalUser: Awaited<ReturnType<typeof createTestUser>>;

  const issuedTokenIds: string[] = [];

  beforeAll(async () => {
    targetUser = await createTestUser();
    secondUser = await createTestUser();
    softDeletedUser = await createTestUser();
    canonicalUser = await createTestUser({
      email: `reset-canonical-${crypto.randomUUID()}@test.local`,
    });
  });

  afterAll(async () => {
    for (const id of issuedTokenIds) {
      await cleanupRaw.passwordResetToken.delete({ where: { id } }).catch(() => undefined);
    }

    await cleanupRaw.passwordResetToken
      .deleteMany({
        where: {
          userId: {
            in: [targetUser.id, secondUser.id, softDeletedUser.id, canonicalUser.id],
          },
        },
      })
      .catch(() => undefined);

    await cleanup(
      { table: "user", id: targetUser.id },
      { table: "user", id: secondUser.id },
      { table: "user", id: softDeletedUser.id },
      { table: "user", id: canonicalUser.id },
    );
  });

  describe("request", () => {
    beforeEach(async () => {
      await cleanupRaw.passwordResetToken.deleteMany({
        where: {
          userId: {
            in: [targetUser.id, secondUser.id, softDeletedUser.id, canonicalUser.id],
          },
        },
      });
      await cleanupRaw.user.update({
        where: { id: softDeletedUser.id },
        data: { deletedAt: null, email: softDeletedUser.email },
      });
    });

    it("creates exactly one unconsumed token row for a known email and zero for an unknown email", async () => {
      await iamPasswordResetApi.request("nobody-unknown@nowhere.test");

      const unknownRows = await cleanupRaw.passwordResetToken.findMany({
        where: { user: { email: "nobody-unknown@nowhere.test" } },
      });

      expect(unknownRows).toHaveLength(0);

      await iamPasswordResetApi.request(targetUser.email);

      const knownRows = await cleanupRaw.passwordResetToken.findMany({
        where: { userId: targetUser.id },
      });

      expect(knownRows).toHaveLength(1);
      expect(knownRows[0]?.consumedAt).toBeNull();

      const id = knownRows[0]?.id;

      if (id) {
        issuedTokenIds.push(id);
      }
    });

    it("resolves without throwing and still creates a token row when the email send fails (no RESEND config)", async () => {
      await expect(iamPasswordResetApi.request(targetUser.email)).resolves.toBeUndefined();

      const rows = await cleanupRaw.passwordResetToken.findMany({
        where: { userId: targetUser.id, consumedAt: null },
      });

      expect(rows).toHaveLength(1);

      const id = rows[0]?.id;

      if (id) {
        issuedTokenIds.push(id);
      }
    });

    it("invalidates the prior unconsumed token when a second request is made for the same user", async () => {
      await iamPasswordResetApi.request(targetUser.email);

      const firstRow = await cleanupRaw.passwordResetToken.findFirst({
        where: { userId: targetUser.id },
        orderBy: { createdAt: "desc" },
      });

      await iamPasswordResetApi.request(targetUser.email);

      const rows = await cleanupRaw.passwordResetToken.findMany({
        where: { userId: targetUser.id },
        orderBy: { createdAt: "asc" },
      });

      expect(rows).toHaveLength(2);
      expect(rows[0]?.id).toBe(firstRow?.id);
      expect(rows[0]?.consumedAt).not.toBeNull();
      expect(rows[1]?.consumedAt).toBeNull();

      for (const row of rows) {
        issuedTokenIds.push(row.id);
      }
    });

    it("issues a token whose expiresAt is within the 1 hour TTL window", async () => {
      const before = Date.now();

      await iamPasswordResetApi.request(targetUser.email);

      const row = await cleanupRaw.passwordResetToken.findFirst({
        where: { userId: targetUser.id, consumedAt: null },
        orderBy: { createdAt: "desc" },
      });
      const diffHours = ((row?.expiresAt.getTime() ?? 0) - before) / MS_PER_HOUR;

      expect(diffHours).toBeGreaterThan(0.9);
      expect(diffHours).toBeLessThan(1.1);

      if (row) {
        issuedTokenIds.push(row.id);
      }
    });

    it("stores the token hashed (not plaintext) with at least 32 bytes of base64url entropy", async () => {
      const { row, plain } = await issueViaRequest(targetUser.email);

      expect(plain).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(Buffer.from(plain, "base64url").length).toBeGreaterThanOrEqual(32);

      const stored = await cleanupRaw.passwordResetToken.findUnique({ where: { id: row.id } });

      expect(stored?.tokenHash).toBe(hashToken(plain));
      expect(stored?.tokenHash).not.toBe(plain);

      issuedTokenIds.push(row.id);
    });

    it("treats a soft-deleted user as unknown and creates no token row", async () => {
      await cleanupRaw.user.update({
        where: { id: softDeletedUser.id },
        data: {
          deletedAt: new Date(),
          email: `${softDeletedUser.email}_deleted_${Date.now()}`,
        },
      });

      await iamPasswordResetApi.request(softDeletedUser.email);

      const rows = await cleanupRaw.passwordResetToken.findMany({
        where: { userId: softDeletedUser.id },
      });

      expect(rows).toHaveLength(0);
    });

    it("normalizes the email (lowercase + trim) and issues a token for the canonical user", async () => {
      await iamPasswordResetApi.request(`  ${canonicalUser.email.toUpperCase()}  `);

      const rows = await cleanupRaw.passwordResetToken.findMany({
        where: { userId: canonicalUser.id, consumedAt: null },
      });

      expect(rows).toHaveLength(1);

      const id = rows[0]?.id;

      if (id) {
        issuedTokenIds.push(id);
      }
    });
  });

  describe("validate", () => {
    beforeEach(async () => {
      await cleanupRaw.passwordResetToken.deleteMany({
        where: { userId: { in: [targetUser.id, softDeletedUser.id] } },
      });
      await cleanupRaw.user.update({
        where: { id: softDeletedUser.id },
        data: { deletedAt: null, email: softDeletedUser.email },
      });
    });

    it("returns { email } for a valid token", async () => {
      const { row, plain } = await issueViaRequest(targetUser.email);
      const result = await iamPasswordResetApi.validate(plain);

      expect(result.email).toBe(targetUser.email);

      issuedTokenIds.push(row.id);
    });

    it("throws GoneError for a non-existent token", async () => {
      await expect(iamPasswordResetApi.validate(generatePlainToken())).rejects.toThrow(GoneError);
    });

    it("throws GoneError for an expired token", async () => {
      const plain = generatePlainToken();
      const row = await cleanupRaw.passwordResetToken.create({
        data: {
          userId: targetUser.id,
          tokenHash: hashToken(plain),
          expiresAt: new Date(Date.now() - PAST_OFFSET_MS),
        },
      });

      issuedTokenIds.push(row.id);

      await expect(iamPasswordResetApi.validate(plain)).rejects.toThrow(GoneError);
    });

    it("throws GoneError for a consumed token", async () => {
      const plain = generatePlainToken();
      const row = await cleanupRaw.passwordResetToken.create({
        data: {
          userId: targetUser.id,
          tokenHash: hashToken(plain),
          expiresAt: new Date(Date.now() + FUTURE_OFFSET_MS),
          consumedAt: new Date(),
        },
      });

      issuedTokenIds.push(row.id);

      await expect(iamPasswordResetApi.validate(plain)).rejects.toThrow(GoneError);
    });

    it("throws GoneError with a generic message for a soft-deleted user's token", async () => {
      const { row, plain } = await issueViaRequest(softDeletedUser.email);

      await cleanupRaw.user.update({
        where: { id: softDeletedUser.id },
        data: {
          deletedAt: new Date(),
          email: `${softDeletedUser.email}_deleted_${Date.now()}`,
        },
      });

      await expect(iamPasswordResetApi.validate(plain)).rejects.toThrow(GoneError);

      const message = await iamPasswordResetApi
        .validate(plain)
        .then(() => null)
        .catch((error: unknown) => (error instanceof GoneError ? error.message : null));

      expect(message).not.toBeNull();
      expect(message).not.toContain("_deleted_");
      expect(message).not.toContain(softDeletedUser.email);

      issuedTokenIds.push(row.id);
    });

    it("emits the same generic GoneError message across NOT_FOUND, EXPIRED, CONSUMED and DELETED_USER", async () => {
      const fakePlain = generatePlainToken();

      const expiredPlain = generatePlainToken();
      const expiredRow = await cleanupRaw.passwordResetToken.create({
        data: {
          userId: targetUser.id,
          tokenHash: hashToken(expiredPlain),
          expiresAt: new Date(Date.now() - PAST_OFFSET_MS),
        },
      });

      issuedTokenIds.push(expiredRow.id);

      const consumedPlain = generatePlainToken();
      const consumedRow = await cleanupRaw.passwordResetToken.create({
        data: {
          userId: targetUser.id,
          tokenHash: hashToken(consumedPlain),
          expiresAt: new Date(Date.now() + FUTURE_OFFSET_MS),
          consumedAt: new Date(),
        },
      });

      issuedTokenIds.push(consumedRow.id);

      const deletedPlain = generatePlainToken();
      const deletedRow = await cleanupRaw.passwordResetToken.create({
        data: {
          userId: softDeletedUser.id,
          tokenHash: hashToken(deletedPlain),
          expiresAt: new Date(Date.now() + FUTURE_OFFSET_MS),
        },
      });

      issuedTokenIds.push(deletedRow.id);

      await cleanupRaw.user.update({
        where: { id: softDeletedUser.id },
        data: {
          deletedAt: new Date(),
          email: `${softDeletedUser.email}_deleted_${Date.now()}`,
        },
      });

      const readMessage = (plain: string): Promise<string | null> =>
        iamPasswordResetApi
          .validate(plain)
          .then(() => null)
          .catch((error: unknown) => (error instanceof GoneError ? error.message : null));

      const notFoundMessage = await readMessage(fakePlain);
      const expiredMessage = await readMessage(expiredPlain);
      const consumedMessage = await readMessage(consumedPlain);
      const deletedMessage = await readMessage(deletedPlain);

      expect(notFoundMessage).not.toBeNull();
      expect(notFoundMessage).not.toContain("@");
      expect(notFoundMessage).not.toContain("_deleted_");
      expect(expiredMessage).toBe(notFoundMessage);
      expect(consumedMessage).toBe(notFoundMessage);
      expect(deletedMessage).toBe(notFoundMessage);
    });
  });

  describe("consume", () => {
    beforeEach(async () => {
      await cleanupRaw.passwordResetToken.deleteMany({
        where: { userId: { in: [targetUser.id, softDeletedUser.id] } },
      });
      await cleanupRaw.user.update({
        where: { id: targetUser.id },
        data: {
          password: null,
          emailVerified: FIXED_PAST_VERIFIED,
          timezone: "America/New_York",
          tokenVersion: 0,
        },
      });
      await cleanupRaw.user.update({
        where: { id: softDeletedUser.id },
        data: { deletedAt: null, email: softDeletedUser.email },
      });
    });

    it("sets the password, bumps tokenVersion, marks the token consumed and returns { email, redirectTo: '/login' }", async () => {
      const { row, plain } = await issueViaRequest(targetUser.email);
      const before = await cleanupRaw.user.findUnique({ where: { id: targetUser.id } });
      const result = await iamPasswordResetApi.consume(plain, { password: testPassword });

      expect(result.email).toBe(targetUser.email);
      expect(result.redirectTo).toBe("/login");

      const after = await cleanupRaw.user.findUnique({ where: { id: targetUser.id } });
      const tokenAfter = await cleanupRaw.passwordResetToken.findUnique({ where: { id: row.id } });

      expect(after?.password).not.toBeNull();

      if (after?.password) {
        expect(await bcrypt.compare(testPassword, after.password)).toBe(true);
      }

      expect(after?.tokenVersion).toBe((before?.tokenVersion ?? 0) + 1);
      expect(tokenAfter?.consumedAt).not.toBeNull();

      issuedTokenIds.push(row.id);
    });

    it("does not touch emailVerified", async () => {
      const { row, plain } = await issueViaRequest(targetUser.email);
      const before = await cleanupRaw.user.findUnique({ where: { id: targetUser.id } });

      expect(before?.emailVerified?.getTime()).toBe(FIXED_PAST_VERIFIED.getTime());

      await iamPasswordResetApi.consume(plain, { password: testPassword });

      const after = await cleanupRaw.user.findUnique({ where: { id: targetUser.id } });

      expect(after?.emailVerified?.getTime()).toBe(FIXED_PAST_VERIFIED.getTime());

      issuedTokenIds.push(row.id);
    });

    it("does not change the user timezone", async () => {
      const { row, plain } = await issueViaRequest(targetUser.email);

      await iamPasswordResetApi.consume(plain, { password: testPassword });

      const after = await cleanupRaw.user.findUnique({ where: { id: targetUser.id } });

      expect(after?.timezone).toBe("America/New_York");

      issuedTokenIds.push(row.id);
    });

    it("throws GoneError for an expired token", async () => {
      const plain = generatePlainToken();
      const row = await cleanupRaw.passwordResetToken.create({
        data: {
          userId: targetUser.id,
          tokenHash: hashToken(plain),
          expiresAt: new Date(Date.now() - PAST_OFFSET_MS),
        },
      });

      issuedTokenIds.push(row.id);

      await expect(iamPasswordResetApi.consume(plain, { password: testPassword })).rejects.toThrow(
        GoneError,
      );
    });

    it("throws GoneError for an already consumed token", async () => {
      const plain = generatePlainToken();
      const row = await cleanupRaw.passwordResetToken.create({
        data: {
          userId: targetUser.id,
          tokenHash: hashToken(plain),
          expiresAt: new Date(Date.now() + FUTURE_OFFSET_MS),
          consumedAt: new Date(),
        },
      });

      issuedTokenIds.push(row.id);

      await expect(iamPasswordResetApi.consume(plain, { password: testPassword })).rejects.toThrow(
        GoneError,
      );
    });

    it("throws GoneError for a non-existent token", async () => {
      await expect(
        iamPasswordResetApi.consume(generatePlainToken(), { password: testPassword }),
      ).rejects.toThrow(GoneError);
    });

    it("throws GoneError when the target user is soft-deleted", async () => {
      const { row, plain } = await issueViaRequest(softDeletedUser.email);

      await cleanupRaw.user.update({
        where: { id: softDeletedUser.id },
        data: {
          deletedAt: new Date(),
          email: `${softDeletedUser.email}_deleted_${Date.now()}`,
        },
      });

      await expect(iamPasswordResetApi.consume(plain, { password: testPassword })).rejects.toThrow(
        GoneError,
      );

      issuedTokenIds.push(row.id);
    });

    it("throws GoneError on a serial double-submit of an already consumed token and keeps the row consumed", async () => {
      const { row, plain } = await issueViaRequest(targetUser.email);

      await iamPasswordResetApi.consume(plain, { password: testPassword });

      await expect(
        iamPasswordResetApi.consume(plain, { password: "another-password-please" }),
      ).rejects.toThrow(GoneError);

      const tokenAfter = await cleanupRaw.passwordResetToken.findUnique({ where: { id: row.id } });

      expect(tokenAfter?.consumedAt).not.toBeNull();

      issuedTokenIds.push(row.id);
    });

    it("is single-use under concurrent consume: exactly one fulfilled, one rejected with GoneError", async () => {
      const { row, plain } = await issueViaRequest(targetUser.email);
      const results = await Promise.allSettled([
        iamPasswordResetApi.consume(plain, { password: "first-password-long-enough" }),
        iamPasswordResetApi.consume(plain, { password: "second-password-long-enough" }),
      ]);
      const fulfilled = results.filter((result) => result.status === "fulfilled");
      const rejected = results.filter((result) => result.status === "rejected");

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      const rejection = rejected[0];

      if (rejection && rejection.status === "rejected") {
        expect(rejection.reason).toBeInstanceOf(GoneError);
      }

      const tokenAfter = await cleanupRaw.passwordResetToken.findUnique({ where: { id: row.id } });

      expect(tokenAfter?.consumedAt).not.toBeNull();

      issuedTokenIds.push(row.id);
    });
  });
});
