import crypto from "node:crypto";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  cleanup,
  cleanupRaw,
  createTestContactSubmission,
  createTestUser,
} from "../../test/helpers";

import {
  MS_PER_DAY,
  RETENTION_ACTION_ITEM_TTL_DAYS,
  RETENTION_INVITE_TOKEN_TTL_DAYS,
  RETENTION_MARKETING_SUBMISSION_TTL_DAYS,
} from "./constants";
import { runRetentionSweep } from "./run-retention-sweep";

const TEST_TAG = `retention-sweep-${crypto.randomUUID()}`;

const minutesMs = (n: number): number => n * 60 * 1000;

describe("runRetentionSweep", () => {
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;
  let targetUser: Awaited<ReturnType<typeof createTestUser>>;
  let coachUser: Awaited<ReturnType<typeof createTestUser>>;
  let coachProfileId: string;
  let athleteUser: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    adminUser = await createTestUser({ name: TEST_TAG });
    targetUser = await createTestUser({ name: TEST_TAG });
    coachUser = await createTestUser({ name: TEST_TAG });
    athleteUser = await createTestUser({ name: TEST_TAG });

    const profile = await cleanupRaw.coachProfile.create({
      data: { userId: coachUser.id },
    });

    coachProfileId = profile.id;
  });

  afterAll(async () => {
    await cleanupRaw.requestIdempotency.deleteMany({ where: { route: TEST_TAG } });
    await cleanupRaw.coachActionItem.deleteMany({ where: { coachId: coachProfileId } });
    await cleanupRaw.userInviteToken.deleteMany({
      where: { userId: { in: [targetUser.id, coachUser.id, athleteUser.id, adminUser.id] } },
    });
    await cleanupRaw.marketingContactSubmission.deleteMany({ where: { name: TEST_TAG } });
    await cleanup(
      { table: "coachProfile", id: coachProfileId },
      { table: "user", id: coachUser.id },
      { table: "user", id: athleteUser.id },
      { table: "user", id: targetUser.id },
      { table: "user", id: adminUser.id },
    );
  });

  beforeEach(async () => {
    await cleanupRaw.requestIdempotency.deleteMany({ where: { route: TEST_TAG } });
    await cleanupRaw.coachActionItem.deleteMany({ where: { coachId: coachProfileId } });
    await cleanupRaw.userInviteToken.deleteMany({
      where: { userId: { in: [targetUser.id, coachUser.id, athleteUser.id, adminUser.id] } },
    });
    await cleanupRaw.marketingContactSubmission.deleteMany({ where: { name: TEST_TAG } });
  });

  describe("RequestIdempotency", () => {
    it("keeps row whose expiresAt is in the future", async () => {
      const future = new Date(Date.now() + minutesMs(5));

      await cleanupRaw.requestIdempotency.create({
        data: {
          key: `keep-${crypto.randomUUID()}`,
          scope: TEST_TAG,
          route: TEST_TAG,
          method: "POST",
          requestFingerprint: "fp",
          responseStatus: 200,
          responseBody: {},
          responseHeaders: {},
          expiresAt: future,
        },
      });

      const result = await runRetentionSweep();
      const remaining = await cleanupRaw.requestIdempotency.count({
        where: { route: TEST_TAG },
      });

      expect(result.requestIdempotencyDeleted).toBeGreaterThanOrEqual(0);
      expect(remaining).toBe(1);
    });

    it("deletes row whose expiresAt is in the past", async () => {
      const past = new Date(Date.now() - minutesMs(5));

      await cleanupRaw.requestIdempotency.create({
        data: {
          key: `prune-${crypto.randomUUID()}`,
          scope: TEST_TAG,
          route: TEST_TAG,
          method: "POST",
          requestFingerprint: "fp",
          responseStatus: 200,
          responseBody: {},
          responseHeaders: {},
          expiresAt: past,
        },
      });

      await runRetentionSweep();

      const remaining = await cleanupRaw.requestIdempotency.count({
        where: { route: TEST_TAG },
      });

      expect(remaining).toBe(0);
    });
  });

  describe("UserInviteToken", () => {
    const buildToken = async (overrides: {
      consumedAt?: Date | null;
      expiresAt: Date;
    }): Promise<string> => {
      const row = await cleanupRaw.userInviteToken.create({
        data: {
          userId: targetUser.id,
          createdByAdminId: adminUser.id,
          tokenHash: crypto.randomUUID(),
          expiresAt: overrides.expiresAt,
          consumedAt: overrides.consumedAt ?? null,
        },
      });

      return row.id;
    };

    it("keeps token consumed exactly at the boundary (cutoff minus 1 minute)", async () => {
      const justInside = new Date(
        Date.now() - RETENTION_INVITE_TOKEN_TTL_DAYS * MS_PER_DAY + minutesMs(1),
      );
      const future = new Date(Date.now() + minutesMs(5));
      const id = await buildToken({ consumedAt: justInside, expiresAt: future });

      await runRetentionSweep();

      const row = await cleanupRaw.userInviteToken.findUnique({ where: { id } });

      expect(row).not.toBeNull();
    });

    it("deletes token consumed past the 30-day cutoff", async () => {
      const wayPast = new Date(
        Date.now() - RETENTION_INVITE_TOKEN_TTL_DAYS * MS_PER_DAY - minutesMs(5),
      );
      const future = new Date(Date.now() + minutesMs(5));
      const id = await buildToken({ consumedAt: wayPast, expiresAt: future });

      await runRetentionSweep();

      const row = await cleanupRaw.userInviteToken.findUnique({ where: { id } });

      expect(row).toBeNull();
    });

    it("deletes token expired past the 30-day cutoff regardless of consumedAt", async () => {
      const expiredLongAgo = new Date(
        Date.now() - RETENTION_INVITE_TOKEN_TTL_DAYS * MS_PER_DAY - minutesMs(5),
      );
      const id = await buildToken({ consumedAt: null, expiresAt: expiredLongAgo });

      await runRetentionSweep();

      const row = await cleanupRaw.userInviteToken.findUnique({ where: { id } });

      expect(row).toBeNull();
    });
  });

  describe("CoachActionItem", () => {
    const buildItem = async (resolvedAt: Date | null): Promise<string> => {
      const row = await cleanupRaw.coachActionItem.create({
        data: {
          coachId: coachProfileId,
          athleteId: athleteUser.id,
          type: "MISSED_WORKOUTS",
          severity: "INFO",
          status: resolvedAt ? "RESOLVED" : "OPEN",
          message: TEST_TAG,
          resolvedAt,
        },
      });

      return row.id;
    };

    it("keeps resolved item just inside the 90-day boundary", async () => {
      const justInside = new Date(
        Date.now() - RETENTION_ACTION_ITEM_TTL_DAYS * MS_PER_DAY + minutesMs(1),
      );
      const id = await buildItem(justInside);

      await runRetentionSweep();

      const row = await cleanupRaw.coachActionItem.findUnique({ where: { id } });

      expect(row).not.toBeNull();
    });

    it("deletes resolved item past the 90-day boundary", async () => {
      const wayPast = new Date(
        Date.now() - RETENTION_ACTION_ITEM_TTL_DAYS * MS_PER_DAY - minutesMs(5),
      );
      const id = await buildItem(wayPast);

      await runRetentionSweep();

      const row = await cleanupRaw.coachActionItem.findUnique({ where: { id } });

      expect(row).toBeNull();
    });

    it("keeps OPEN item even with no resolvedAt set", async () => {
      const id = await buildItem(null);

      await runRetentionSweep();

      const row = await cleanupRaw.coachActionItem.findUnique({ where: { id } });

      expect(row).not.toBeNull();
    });
  });

  describe("MarketingContactSubmission", () => {
    it("keeps soft-deleted submission just inside the 30-day boundary", async () => {
      const submission = await createTestContactSubmission({ name: TEST_TAG });
      const justInside = new Date(
        Date.now() - RETENTION_MARKETING_SUBMISSION_TTL_DAYS * MS_PER_DAY + minutesMs(1),
      );

      await cleanupRaw.marketingContactSubmission.update({
        where: { id: submission.id },
        data: { deletedAt: justInside },
      });

      await runRetentionSweep();

      const row = await cleanupRaw.marketingContactSubmission.findUnique({
        where: { id: submission.id },
      });

      expect(row).not.toBeNull();
    });

    it("hard-deletes soft-deleted submission past the 30-day boundary", async () => {
      const submission = await createTestContactSubmission({ name: TEST_TAG });
      const wayPast = new Date(
        Date.now() - RETENTION_MARKETING_SUBMISSION_TTL_DAYS * MS_PER_DAY - minutesMs(5),
      );

      await cleanupRaw.marketingContactSubmission.update({
        where: { id: submission.id },
        data: { deletedAt: wayPast },
      });

      await runRetentionSweep();

      const row = await cleanupRaw.marketingContactSubmission.findUnique({
        where: { id: submission.id },
      });

      expect(row).toBeNull();
    });

    it("keeps live submission with deletedAt null", async () => {
      const submission = await createTestContactSubmission({ name: TEST_TAG });

      await runRetentionSweep();

      const row = await cleanupRaw.marketingContactSubmission.findUnique({
        where: { id: submission.id },
      });

      expect(row).not.toBeNull();
      expect(row?.deletedAt).toBeNull();
    });
  });
});
