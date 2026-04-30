import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import {
  buildApplyFixture,
  makeBlockPayload,
  makeSessionPayload,
  makeWeekPayload,
} from "../../services/lms/apply-template/apply-template.fixtures";
import { cleanup, cleanupRaw, createTestCoach, createTestUser } from "../../test/helpers";

import { lmsBlockTemplateApi } from "./block-template";
import { lmsSessionTemplateApi } from "./session-template";
import { lmsWeekTemplateApi } from "./week-template";

const toJson = (v: unknown) => v as Prisma.InputJsonValue;

describe("template promote/demote name collisions (integration)", () => {
  let admin: Awaited<ReturnType<typeof createTestUser>>;
  let coachB: Awaited<ReturnType<typeof createTestCoach>>;
  let athlete: Awaited<ReturnType<typeof createTestUser>>;
  let fixture: Awaited<ReturnType<typeof buildApplyFixture>>;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    fixture = await buildApplyFixture();
    admin = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
    coachB = await createTestCoach();
    athlete = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ATHLETE] });
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
    await cleanup(...fixture.toCleanup);
    await cleanupRaw.coachProfile.delete({ where: { id: coachB.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coachB.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: admin.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: athlete.id } }).catch(() => {});
  });

  describe("BlockTemplate promote/demote", () => {
    it("promote rejects on SYSTEM-name collision with 400", async () => {
      const sharedName = `BT Coll ${crypto.randomUUID().slice(0, 8)}`;

      const sys = await cleanupRaw.blockTemplate.create({
        data: {
          scope: "SYSTEM",
          name: sharedName,
          payload: toJson(makeBlockPayload(fixture.blockKindId, fixture.exerciseId)),
        },
      });

      toCleanup.push({ table: "blockTemplate", id: sys.id });

      const own = await cleanupRaw.blockTemplate.create({
        data: {
          scope: "COACH",
          ownerId: fixture.coachUserId,
          name: sharedName,
          payload: toJson(makeBlockPayload(fixture.blockKindId, fixture.exerciseId)),
        },
      });

      toCleanup.push({ table: "blockTemplate", id: own.id });

      await expect(lmsBlockTemplateApi.promote(admin.id, own.id)).rejects.toMatchObject({
        statusCode: 400,
        details: { existingId: sys.id, candidateName: sharedName },
      });
    });

    it("demote rejects on COACH-(owner,name) collision with 400", async () => {
      const sharedName = `BT Demote Coll ${crypto.randomUUID().slice(0, 8)}`;

      const sys = await cleanupRaw.blockTemplate.create({
        data: {
          scope: "SYSTEM",
          name: sharedName,
          payload: toJson(makeBlockPayload(fixture.blockKindId, fixture.exerciseId)),
        },
      });

      toCleanup.push({ table: "blockTemplate", id: sys.id });

      const coachOwn = await cleanupRaw.blockTemplate.create({
        data: {
          scope: "COACH",
          ownerId: fixture.coachUserId,
          name: sharedName,
          payload: toJson(makeBlockPayload(fixture.blockKindId, fixture.exerciseId)),
        },
      });

      toCleanup.push({ table: "blockTemplate", id: coachOwn.id });

      await expect(
        lmsBlockTemplateApi.demote(admin.id, sys.id, { newOwnerId: fixture.coachUserId }),
      ).rejects.toMatchObject({
        statusCode: 400,
        details: { existingId: coachOwn.id, candidateName: sharedName },
      });
    });

    it("demote rejects non-coach newOwnerId with 400", async () => {
      const sys = await cleanupRaw.blockTemplate.create({
        data: {
          scope: "SYSTEM",
          name: `BT WrongOwner ${crypto.randomUUID().slice(0, 8)}`,
          payload: toJson(makeBlockPayload(fixture.blockKindId, fixture.exerciseId)),
        },
      });

      toCleanup.push({ table: "blockTemplate", id: sys.id });

      await expect(
        lmsBlockTemplateApi.demote(admin.id, sys.id, { newOwnerId: athlete.id }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("promote rejects already-SYSTEM with 409", async () => {
      const sys = await cleanupRaw.blockTemplate.create({
        data: {
          scope: "SYSTEM",
          name: `BT AlreadySys ${crypto.randomUUID().slice(0, 8)}`,
          payload: toJson(makeBlockPayload(fixture.blockKindId, fixture.exerciseId)),
        },
      });

      toCleanup.push({ table: "blockTemplate", id: sys.id });

      await expect(lmsBlockTemplateApi.promote(admin.id, sys.id)).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  describe("SessionTemplate promote/demote", () => {
    it("promote rejects on SYSTEM-name collision with 400", async () => {
      const sharedName = `ST Coll ${crypto.randomUUID().slice(0, 8)}`;

      const sys = await cleanupRaw.sessionTemplate.create({
        data: {
          scope: "SYSTEM",
          name: sharedName,
          payload: toJson(makeSessionPayload(fixture.blockKindId, fixture.exerciseId)),
        },
      });

      toCleanup.push({ table: "sessionTemplate", id: sys.id });

      const own = await cleanupRaw.sessionTemplate.create({
        data: {
          scope: "COACH",
          ownerId: fixture.coachUserId,
          name: sharedName,
          payload: toJson(makeSessionPayload(fixture.blockKindId, fixture.exerciseId)),
        },
      });

      toCleanup.push({ table: "sessionTemplate", id: own.id });

      await expect(lmsSessionTemplateApi.promote(admin.id, own.id)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("demote happy path: SYSTEM → COACH(coachB)", async () => {
      const sys = await cleanupRaw.sessionTemplate.create({
        data: {
          scope: "SYSTEM",
          name: `ST DemoteHappy ${crypto.randomUUID().slice(0, 8)}`,
          payload: toJson(makeSessionPayload(fixture.blockKindId, fixture.exerciseId)),
        },
      });

      toCleanup.push({ table: "sessionTemplate", id: sys.id });

      const demoted = await lmsSessionTemplateApi.demote(admin.id, sys.id, {
        newOwnerId: coachB.user.id,
      });

      expect(demoted.scope).toBe("COACH");
      expect(demoted.ownerId).toBe(coachB.user.id);
    });
  });

  describe("WeekTemplate promote/demote", () => {
    it("promote happy path: COACH → SYSTEM", async () => {
      const own = await cleanupRaw.weekTemplate.create({
        data: {
          scope: "COACH",
          ownerId: fixture.coachUserId,
          name: `WT Promote Happy ${crypto.randomUUID().slice(0, 8)}`,
          payload: toJson(makeWeekPayload(fixture.blockKindId, fixture.exerciseId)),
        },
      });

      toCleanup.push({ table: "weekTemplate", id: own.id });

      const promoted = await lmsWeekTemplateApi.promote(admin.id, own.id);

      expect(promoted.scope).toBe("SYSTEM");
      expect(promoted.ownerId).toBeNull();
    });

    it("demote rejects already-COACH with 409", async () => {
      const own = await cleanupRaw.weekTemplate.create({
        data: {
          scope: "COACH",
          ownerId: fixture.coachUserId,
          name: `WT AlreadyCoach ${crypto.randomUUID().slice(0, 8)}`,
          payload: toJson(makeWeekPayload(fixture.blockKindId, fixture.exerciseId)),
        },
      });

      toCleanup.push({ table: "weekTemplate", id: own.id });

      await expect(
        lmsWeekTemplateApi.demote(admin.id, own.id, { newOwnerId: coachB.user.id }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("promote rejects non-admin with 403", async () => {
      const own = await cleanupRaw.weekTemplate.create({
        data: {
          scope: "COACH",
          ownerId: fixture.coachUserId,
          name: `WT Forbidden ${crypto.randomUUID().slice(0, 8)}`,
          payload: toJson(makeWeekPayload(fixture.blockKindId, fixture.exerciseId)),
        },
      });

      toCleanup.push({ table: "weekTemplate", id: own.id });

      await expect(lmsWeekTemplateApi.promote(athlete.id, own.id)).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });
});
