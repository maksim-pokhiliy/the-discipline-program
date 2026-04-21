import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { baseEnv } from "@repo/env/base";
import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  TooManyRequestsError,
} from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { cleanup, cleanupRaw, createTestUser } from "../../test/helpers";

import * as sendModule from "./send-invitation-email";
import { iamUserAdminApi } from "./users-admin";

type MutableBaseEnv = { FEATURE_USER_INVITE_ENABLED: boolean };
const mutableEnv = baseEnv as unknown as MutableBaseEnv;

describe("iamUserAdminApi — createUser / resendInvite flag-gated surface", () => {
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;
  let regularUser: Awaited<ReturnType<typeof createTestUser>>;
  const sendSpy = vi
    .spyOn(sendModule, "sendInvitationEmail")
    .mockImplementation(async () => undefined);
  const configSpy = vi.spyOn(sendModule, "resolveInviteEmailConfig").mockImplementation(() => ({
    apiKey: "test-key",
    from: { email: "test@example.com" },
  }));

  beforeAll(async () => {
    adminUser = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
    regularUser = await createTestUser();
  });

  afterAll(async () => {
    await cleanupRaw.userInviteToken
      .deleteMany({ where: { createdByAdminId: adminUser.id } })
      .catch(() => undefined);
    await cleanup({ table: "user", id: adminUser.id }, { table: "user", id: regularUser.id });

    sendSpy.mockRestore();
    configSpy.mockRestore();
    mutableEnv.FEATURE_USER_INVITE_ENABLED = false;
  });

  beforeEach(() => {
    sendSpy.mockClear();
    configSpy.mockClear();
    configSpy.mockImplementation(() => ({
      apiKey: "test-key",
      from: { email: "test@example.com" },
    }));
  });

  afterEach(async () => {
    mutableEnv.FEATURE_USER_INVITE_ENABLED = false;
  });

  describe("createUser with flag off", () => {
    beforeEach(() => {
      mutableEnv.FEATURE_USER_INVITE_ENABLED = false;
    });

    it("creates a user with password=null, emailVerified=null, and no invite/email", async () => {
      const email = `create-off-${crypto.randomUUID()}@test.local`;
      const user = await iamUserAdminApi.createUser(adminUser.id, {
        email,
        name: "Test Create",
        role: UserRole.ATHLETE,
        timezone: "UTC",
        coachIds: [],
      });

      try {
        expect(user.email).toBe(email);
        expect(user.role).toBe(UserRole.ATHLETE);
        expect(sendSpy).not.toHaveBeenCalled();

        const row = await cleanupRaw.user.findUnique({ where: { id: user.id } });

        expect(row?.password).toBeNull();
        expect(row?.emailVerified).toBeNull();

        const tokens = await cleanupRaw.userInviteToken.findMany({ where: { userId: user.id } });

        expect(tokens).toHaveLength(0);
      } finally {
        await cleanup({ table: "user", id: user.id });
      }
    });

    it("throws ConflictError on duplicate email", async () => {
      await expect(
        iamUserAdminApi.createUser(adminUser.id, {
          email: regularUser.email,
          name: "Duplicate",
          role: UserRole.ATHLETE,
          timezone: "UTC",
          coachIds: [],
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("createUser with flag on", () => {
    beforeEach(() => {
      mutableEnv.FEATURE_USER_INVITE_ENABLED = true;
    });

    it("issues a token and sends invitation email after user creation", async () => {
      const email = `invite-${crypto.randomUUID()}@test.local`;
      const user = await iamUserAdminApi.createUser(adminUser.id, {
        email,
        name: "Invite Target",
        role: UserRole.ATHLETE,
        timezone: "UTC",
        coachIds: [],
      });

      try {
        expect(sendSpy).toHaveBeenCalledTimes(1);

        const tokens = await cleanupRaw.userInviteToken.findMany({ where: { userId: user.id } });

        expect(tokens).toHaveLength(1);
        expect(tokens[0]?.consumedAt).toBeNull();
      } finally {
        await cleanupRaw.userInviteToken.deleteMany({ where: { userId: user.id } });
        await cleanup({ table: "user", id: user.id });
      }
    });

    it("throws InternalServerError and does not create user when Resend config is missing", async () => {
      configSpy.mockImplementation(() => {
        throw new InternalServerError(
          "Invite flow enabled but RESEND_API_KEY or EMAIL_FROM missing",
        );
      });

      const email = `config-fail-${crypto.randomUUID()}@test.local`;

      await expect(
        iamUserAdminApi.createUser(adminUser.id, {
          email,
          name: null,
          role: UserRole.ATHLETE,
          timezone: "UTC",
          coachIds: [],
        }),
      ).rejects.toThrow(InternalServerError);

      const row = await cleanupRaw.user.findUnique({ where: { email } });

      expect(row).toBeNull();
      expect(sendSpy).not.toHaveBeenCalled();
    });
  });

  describe("resendInvite with flag off", () => {
    beforeEach(() => {
      mutableEnv.FEATURE_USER_INVITE_ENABLED = false;
    });

    it("throws BadRequestError when FEATURE_USER_INVITE_ENABLED is false", async () => {
      await expect(iamUserAdminApi.resendInvite(adminUser.id, regularUser.id)).rejects.toThrow(
        BadRequestError,
      );
    });
  });

  describe("resendInvite with flag on", () => {
    beforeEach(() => {
      mutableEnv.FEATURE_USER_INVITE_ENABLED = true;
    });

    it("issues a new token, marks prior unconsumed as consumed, and sends an email", async () => {
      const target = await createTestUser();

      try {
        sendSpy.mockClear();

        const first = await cleanupRaw.userInviteToken.create({
          data: {
            userId: target.id,
            tokenHash: `hash-${crypto.randomUUID()}`,
            expiresAt: new Date(Date.now() + 3_600_000),
            createdByAdminId: adminUser.id,
          },
        });
        const result = await iamUserAdminApi.resendInvite(adminUser.id, target.id);

        expect(result.expiresAt).toBeInstanceOf(Date);
        expect(sendSpy).toHaveBeenCalledTimes(1);

        const firstAfter = await cleanupRaw.userInviteToken.findUnique({
          where: { id: first.id },
        });

        expect(firstAfter?.consumedAt).not.toBeNull();

        const active = await cleanupRaw.userInviteToken.findMany({
          where: { userId: target.id, consumedAt: null },
        });

        expect(active).toHaveLength(1);
      } finally {
        await cleanupRaw.userInviteToken.deleteMany({ where: { userId: target.id } });
        await cleanup({ table: "user", id: target.id });
      }
    });

    it("throws ConflictError when target user already has a password set", async () => {
      const target = await createTestUser({
        password: "$2a$12$somefakeBcryptHashPlaceholderValue...",
      });

      try {
        await expect(iamUserAdminApi.resendInvite(adminUser.id, target.id)).rejects.toThrow(
          ConflictError,
        );
      } finally {
        await cleanup({ table: "user", id: target.id });
      }
    });

    it("throws TooManyRequestsError when there are already 3+ tokens in the last 24h", async () => {
      const target = await createTestUser();

      try {
        for (let i = 0; i < 3; i++) {
          await cleanupRaw.userInviteToken.create({
            data: {
              userId: target.id,
              tokenHash: `hash-${crypto.randomUUID()}`,
              expiresAt: new Date(Date.now() + 3_600_000),
              createdByAdminId: adminUser.id,
              createdAt: new Date(Date.now() - i * 60_000),
            },
          });
        }

        await expect(iamUserAdminApi.resendInvite(adminUser.id, target.id)).rejects.toThrow(
          TooManyRequestsError,
        );
      } finally {
        await cleanupRaw.userInviteToken.deleteMany({ where: { userId: target.id } });
        await cleanup({ table: "user", id: target.id });
      }
    });
  });
});
