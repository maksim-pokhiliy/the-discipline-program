import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { AUTH_CONSTANTS, UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { GOLDEN_BCRYPT_HASH, GOLDEN_PASSWORD } from "../../test/golden-fixture";
import { cleanup, cleanupRaw, createTestUser } from "../../test/helpers";

import { iamAuthService } from "./auth-service";
import { readBcryptCost } from "./bcrypt-cost";

const TEST_PASSWORD = "secure-test-password-123";

describe("iamAuthService", () => {
  let userWithPassword: Awaited<ReturnType<typeof createTestUser>>;
  let hashedPassword: string;

  beforeAll(async () => {
    hashedPassword = await iamAuthService.hashPassword(TEST_PASSWORD);
    userWithPassword = await createTestUser({
      password: hashedPassword,
      role: ROLE_TO_PRISMA_MAP[UserRole.COACH],
    });
  });

  afterAll(async () => {
    await cleanup({ table: "user", id: userWithPassword.id });
  });

  describe("hashPassword", () => {
    it("produces a valid bcrypt hash", async () => {
      const hash = await iamAuthService.hashPassword("test-password");

      expect(hash).toMatch(/^\$2[aby]?\$\d{2}\$/);
    });

    it("produces different hashes for the same input", async () => {
      const hash1 = await iamAuthService.hashPassword("same-password");
      const hash2 = await iamAuthService.hashPassword("same-password");

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("comparePassword", () => {
    it("returns true for matching password and hash", async () => {
      const result = await iamAuthService.comparePassword(TEST_PASSWORD, hashedPassword);

      expect(result).toBe(true);
    });

    it("returns false for wrong password", async () => {
      const result = await iamAuthService.comparePassword("wrong-password", hashedPassword);

      expect(result).toBe(false);
    });
  });

  describe("validateUser", () => {
    it("returns user with correct fields for valid credentials", async () => {
      const result = await iamAuthService.validateUser(userWithPassword.email, TEST_PASSWORD);

      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        id: userWithPassword.id,
        email: userWithPassword.email,
        name: userWithPassword.name,
        role: UserRole.COACH,
      });
    });

    it("returns mapped UserRole values", async () => {
      const result = await iamAuthService.validateUser(userWithPassword.email, TEST_PASSWORD);

      expect(result?.role).toBe(UserRole.COACH);
      expect(Object.values(UserRole)).toContain(result?.role);
    });

    it("includes tokenVersion in result", async () => {
      const result = await iamAuthService.validateUser(userWithPassword.email, TEST_PASSWORD);

      expect(result).toHaveProperty("tokenVersion");
      expect(typeof result?.tokenVersion).toBe("number");
    });

    it("returns null for wrong password", async () => {
      const result = await iamAuthService.validateUser(userWithPassword.email, "wrong-password");

      expect(result).toBeNull();
    });

    it("returns null for non-existent email", async () => {
      const result = await iamAuthService.validateUser("nonexistent@nowhere.local", TEST_PASSWORD);

      expect(result).toBeNull();
    });

    it("returns null for password exceeding MAX_PASSWORD_LENGTH", async () => {
      const longPassword = "a".repeat(AUTH_CONSTANTS.MAX_PASSWORD_LENGTH + 1);

      const result = await iamAuthService.validateUser(userWithPassword.email, longPassword);

      expect(result).toBeNull();
    });
  });

  describe("validateUser — bcrypt cost upgrade (AS-7)", () => {
    const created: string[] = [];

    const userWithHash = async (password: string | null) => {
      const user = await createTestUser({ password });

      created.push(user.id);

      return user;
    };

    const storedStateOf = async (id: string) =>
      cleanupRaw.user.findUnique({ where: { id }, select: { password: true, tokenVersion: true } });

    afterAll(async () => {
      await cleanup(...created.map((id) => ({ table: "user", id })));
    });

    it("rewrites a legacy cost-10 credential at the platform cost on a successful login", async () => {
      const user = await userWithHash(GOLDEN_BCRYPT_HASH);

      expect(readBcryptCost(GOLDEN_BCRYPT_HASH)).toBe(10);

      const result = await iamAuthService.validateUser(user.email, GOLDEN_PASSWORD);
      const stored = await storedStateOf(user.id);

      expect(result).not.toBeNull();
      expect(stored?.password).not.toBe(GOLDEN_BCRYPT_HASH);
      expect(readBcryptCost(stored?.password ?? "")).toBe(AUTH_CONSTANTS.BCRYPT_COST_FACTOR);
    });

    it("leaves the upgraded credential verifying the very same password", async () => {
      const user = await userWithHash(GOLDEN_BCRYPT_HASH);

      await iamAuthService.validateUser(user.email, GOLDEN_PASSWORD);

      const stored = await storedStateOf(user.id);

      expect(await iamAuthService.comparePassword(GOLDEN_PASSWORD, stored?.password ?? "")).toBe(
        true,
      );
      expect(await iamAuthService.validateUser(user.email, GOLDEN_PASSWORD)).not.toBeNull();
    });

    it("never bumps tokenVersion, so live sessions survive the rewrite", async () => {
      const user = await userWithHash(GOLDEN_BCRYPT_HASH);
      const before = await storedStateOf(user.id);

      await iamAuthService.validateUser(user.email, GOLDEN_PASSWORD);

      const after = await storedStateOf(user.id);

      expect(after?.tokenVersion).toBe(before?.tokenVersion);
    });

    it("leaves a credential already at the platform cost untouched", async () => {
      const hash = await iamAuthService.hashPassword(GOLDEN_PASSWORD);
      const user = await userWithHash(hash);

      await iamAuthService.validateUser(user.email, GOLDEN_PASSWORD);

      expect((await storedStateOf(user.id))?.password).toBe(hash);
    });

    it("does not rewrite anything when the password is wrong", async () => {
      const user = await userWithHash(GOLDEN_BCRYPT_HASH);

      expect(await iamAuthService.validateUser(user.email, "not-the-password")).toBeNull();
      expect((await storedStateOf(user.id))?.password).toBe(GOLDEN_BCRYPT_HASH);
    });

    it("does not rewrite anything on the over-length path", async () => {
      const user = await userWithHash(GOLDEN_BCRYPT_HASH);
      const longPassword = "a".repeat(AUTH_CONSTANTS.MAX_PASSWORD_LENGTH + 1);

      expect(await iamAuthService.validateUser(user.email, longPassword)).toBeNull();
      expect((await storedStateOf(user.id))?.password).toBe(GOLDEN_BCRYPT_HASH);
    });

    it("does not rewrite anything for a user that carries no credential", async () => {
      const user = await userWithHash(null);

      expect(await iamAuthService.validateUser(user.email, GOLDEN_PASSWORD)).toBeNull();
      expect((await storedStateOf(user.id))?.password).toBeNull();
    });

    it("still signs the user in when the rewrite itself fails", async () => {
      const user = await userWithHash(GOLDEN_BCRYPT_HASH);
      const hashSpy = vi
        .spyOn(iamAuthService, "hashPassword")
        .mockRejectedValueOnce(new Error("bcrypt is having a bad day"));

      const result = await iamAuthService.validateUser(user.email, GOLDEN_PASSWORD);

      expect(result).not.toBeNull();
      expect((await storedStateOf(user.id))?.password).toBe(GOLDEN_BCRYPT_HASH);

      hashSpy.mockRestore();
    });

    it("rewrites once and then stops, so repeated logins do not churn the row", async () => {
      const user = await userWithHash(GOLDEN_BCRYPT_HASH);

      await iamAuthService.validateUser(user.email, GOLDEN_PASSWORD);

      const afterFirst = await storedStateOf(user.id);

      await iamAuthService.validateUser(user.email, GOLDEN_PASSWORD);

      expect((await storedStateOf(user.id))?.password).toBe(afterFirst?.password);
    });
  });

  describe("getUserById", () => {
    it("returns user with correct fields for existing user", async () => {
      const result = await iamAuthService.getUserById(userWithPassword.id);

      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        id: userWithPassword.id,
        email: userWithPassword.email,
        role: UserRole.COACH,
      });
      expect(result).toHaveProperty("tokenVersion");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
    });

    it("returns null for non-existent user ID", async () => {
      const result = await iamAuthService.getUserById(crypto.randomUUID());

      expect(result).toBeNull();
    });
  });
});
