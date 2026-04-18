import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AUTH_CONSTANTS, UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { cleanup, createTestUser } from "../../test/helpers";

import { iamAuthService } from "./auth-service";

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
