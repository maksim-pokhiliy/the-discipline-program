import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { linksApi } from "./links";

const COACH_PROFILE_ID = "clcoach000000000000000000";
const USER_ID = "cluser0000000000000000000";
const PLAN_ID = "clplan0000000000000000000";
const LINK_ID = "cllink0000000000000000000";
const CONNECTION_ID = "clconn0000000000000000000";
const ATHLETE_ID = "clathlete00000000000000000";
const LEGACY_LEVEL_ID = 2;
const LEGACY_USER_ID = 5;
const NOW = new Date("2026-01-05T00:00:00.000Z");

const mocks = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  deleteMock: vi.fn(),
  upsertMock: vi.fn(),
  groupByMock: vi.fn(),
  connectionFindUniqueMock: vi.fn(),
  resolveCoachIdMock: vi.fn(),
  verifyPlanOwnershipMock: vi.fn(),
  verifyMobileLinkOwnershipMock: vi.fn(),
}));

vi.mock("../../../db/client", () => ({
  prisma: {
    mobilePublishLink: {
      findMany: mocks.findManyMock,
      delete: mocks.deleteMock,
      upsert: mocks.upsertMock,
    },
    mobilePublishedDay: { groupBy: mocks.groupByMock },
    mobileConnection: { findUnique: mocks.connectionFindUniqueMock },
    $disconnect: vi.fn(),
  },
}));

vi.mock("../../../authz/guards", () => ({
  resolveCoachId: mocks.resolveCoachIdMock,
  verifyPlanOwnership: mocks.verifyPlanOwnershipMock,
  verifyMobileLinkOwnership: mocks.verifyMobileLinkOwnershipMock,
}));

const makePrismaLink = () => ({
  id: LINK_ID,
  connectionId: CONNECTION_ID,
  planId: PLAN_ID,
  channel: "GENERAL" as const,
  legacyLevelId: LEGACY_LEVEL_ID,
  legacyUserId: null,
  athleteId: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const makeIndividualPrismaLink = () => ({
  id: LINK_ID,
  connectionId: CONNECTION_ID,
  planId: PLAN_ID,
  channel: "INDIVIDUAL" as const,
  legacyLevelId: null,
  legacyUserId: LEGACY_USER_ID,
  athleteId: ATHLETE_ID,
  createdAt: NOW,
  updatedAt: NOW,
});

const makePrismaError = (
  code: string,
  meta?: Record<string, unknown>,
): Prisma.PrismaClientKnownRequestError =>
  new Prisma.PrismaClientKnownRequestError("Prisma error", {
    code,
    clientVersion: "5.0.0",
    ...(meta && { meta }),
  });

describe("linksApi.listLinks", () => {
  beforeEach(() => {
    mocks.findManyMock.mockReset();
    mocks.groupByMock.mockReset();
    mocks.resolveCoachIdMock.mockReset();
    mocks.verifyPlanOwnershipMock.mockReset();
    mocks.resolveCoachIdMock.mockResolvedValue(COACH_PROFILE_ID);
    mocks.verifyPlanOwnershipMock.mockResolvedValue(undefined);
    mocks.findManyMock.mockResolvedValue([makePrismaLink()]);
    mocks.groupByMock.mockResolvedValue([]);
  });

  it("scopes the findMany by planId and the coach's connection after verifying plan ownership", async () => {
    const result = await linksApi.listLinks(USER_ID, PLAN_ID);

    expect(mocks.resolveCoachIdMock).toHaveBeenCalledWith(USER_ID);
    expect(mocks.verifyPlanOwnershipMock).toHaveBeenCalledWith(PLAN_ID, USER_ID);
    expect(mocks.findManyMock).toHaveBeenCalledWith({
      where: { planId: PLAN_ID, connection: { coachProfileId: COACH_PROFILE_ID } },
      orderBy: { createdAt: "asc" },
    });
    expect(result).toEqual([
      {
        id: LINK_ID,
        planId: PLAN_ID,
        channel: "GENERAL",
        legacyLevelId: LEGACY_LEVEL_ID,
        legacyUserId: null,
        athleteId: null,
        publishedDayCount: 0,
        lastPublishedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ]);
  });

  it("short-circuits before findMany when plan ownership fails", async () => {
    const { ForbiddenError } = await import("@repo/errors");

    mocks.verifyPlanOwnershipMock.mockRejectedValue(new ForbiddenError("not your plan"));

    await expect(linksApi.listLinks(USER_ID, PLAN_ID)).rejects.toBeInstanceOf(ForbiddenError);

    expect(mocks.findManyMock).not.toHaveBeenCalled();
  });
});

describe("linksApi.createLink", () => {
  beforeEach(() => {
    mocks.upsertMock.mockReset();
    mocks.groupByMock.mockReset();
    mocks.connectionFindUniqueMock.mockReset();
    mocks.resolveCoachIdMock.mockReset();
    mocks.verifyPlanOwnershipMock.mockReset();
    mocks.resolveCoachIdMock.mockResolvedValue(COACH_PROFILE_ID);
    mocks.verifyPlanOwnershipMock.mockResolvedValue(undefined);
    mocks.connectionFindUniqueMock.mockResolvedValue({ id: CONNECTION_ID });
    mocks.upsertMock.mockResolvedValue(makePrismaLink());
    mocks.groupByMock.mockResolvedValue([]);
  });

  it("upserts a GENERAL link on the (plan, channel, legacyLevelId) key", async () => {
    const result = await linksApi.createLink(USER_ID, {
      planId: PLAN_ID,
      legacyLevelId: LEGACY_LEVEL_ID,
    });

    expect(mocks.resolveCoachIdMock).toHaveBeenCalledWith(USER_ID);
    expect(mocks.verifyPlanOwnershipMock).toHaveBeenCalledWith(PLAN_ID, USER_ID);
    expect(mocks.connectionFindUniqueMock).toHaveBeenCalledWith({
      where: { coachProfileId: COACH_PROFILE_ID },
      select: { id: true },
    });
    expect(mocks.upsertMock).toHaveBeenCalledWith({
      where: {
        planId_channel_legacyLevelId: {
          planId: PLAN_ID,
          channel: "GENERAL",
          legacyLevelId: LEGACY_LEVEL_ID,
        },
      },
      create: {
        connectionId: CONNECTION_ID,
        planId: PLAN_ID,
        channel: "GENERAL",
        legacyLevelId: LEGACY_LEVEL_ID,
      },
      update: { connectionId: CONNECTION_ID },
    });
    expect(result.channel).toBe("GENERAL");
    expect(result.legacyLevelId).toBe(LEGACY_LEVEL_ID);
  });

  it("upserts an INDIVIDUAL link keyed on athleteId, re-pointing legacyUserId on update", async () => {
    mocks.upsertMock.mockResolvedValue(makeIndividualPrismaLink());

    const result = await linksApi.createLink(USER_ID, {
      planId: PLAN_ID,
      channel: "INDIVIDUAL",
      athleteId: ATHLETE_ID,
      legacyUserId: LEGACY_USER_ID,
    });

    expect(mocks.upsertMock).toHaveBeenCalledWith({
      where: {
        planId_channel_athleteId: {
          planId: PLAN_ID,
          channel: "INDIVIDUAL",
          athleteId: ATHLETE_ID,
        },
      },
      create: {
        connectionId: CONNECTION_ID,
        planId: PLAN_ID,
        channel: "INDIVIDUAL",
        legacyUserId: LEGACY_USER_ID,
        athleteId: ATHLETE_ID,
      },
      update: { connectionId: CONNECTION_ID, legacyUserId: LEGACY_USER_ID },
    });
    expect(result).toEqual({
      id: LINK_ID,
      planId: PLAN_ID,
      channel: "INDIVIDUAL",
      legacyLevelId: null,
      legacyUserId: LEGACY_USER_ID,
      athleteId: ATHLETE_ID,
      publishedDayCount: 0,
      lastPublishedAt: null,
      createdAt: NOW,
      updatedAt: NOW,
    });
  });

  it("rejects with BadRequestError when the coach has no mobile connection", async () => {
    const { BadRequestError } = await import("@repo/errors");

    mocks.connectionFindUniqueMock.mockResolvedValue(null);

    await expect(
      linksApi.createLink(USER_ID, { planId: PLAN_ID, legacyLevelId: LEGACY_LEVEL_ID }),
    ).rejects.toBeInstanceOf(BadRequestError);

    expect(mocks.upsertMock).not.toHaveBeenCalled();
  });

  it("maps a P2002 on legacyUserId to a clear ConflictError (the legacy athlete is already linked)", async () => {
    const { ConflictError } = await import("@repo/errors");

    mocks.upsertMock.mockRejectedValue(
      makePrismaError("P2002", { target: ["planId", "channel", "legacyUserId"] }),
    );

    const attempt = linksApi.createLink(USER_ID, {
      planId: PLAN_ID,
      channel: "INDIVIDUAL",
      athleteId: ATHLETE_ID,
      legacyUserId: LEGACY_USER_ID,
    });

    await expect(attempt).rejects.toBeInstanceOf(ConflictError);
    await expect(attempt).rejects.toThrow("already linked to another plan member");
  });

  it("maps a P2003 FK violation on a bad athleteId to a BadRequestError", async () => {
    const { BadRequestError } = await import("@repo/errors");

    mocks.upsertMock.mockRejectedValue(makePrismaError("P2003", { field_name: "athleteId" }));

    await expect(
      linksApi.createLink(USER_ID, {
        planId: PLAN_ID,
        channel: "INDIVIDUAL",
        athleteId: ATHLETE_ID,
        legacyUserId: LEGACY_USER_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});

describe("linksApi.deleteLink", () => {
  beforeEach(() => {
    mocks.deleteMock.mockReset();
    mocks.verifyMobileLinkOwnershipMock.mockReset();
    mocks.verifyMobileLinkOwnershipMock.mockResolvedValue(undefined);
    mocks.deleteMock.mockResolvedValue(makePrismaLink());
  });

  it("verifies ownership then deletes the link by id", async () => {
    await linksApi.deleteLink(USER_ID, LINK_ID);

    expect(mocks.verifyMobileLinkOwnershipMock).toHaveBeenCalledWith(LINK_ID, USER_ID);
    expect(mocks.deleteMock).toHaveBeenCalledWith({ where: { id: LINK_ID } });
  });

  it("short-circuits before delete when link ownership fails", async () => {
    const { NotFoundError } = await import("@repo/errors");

    mocks.verifyMobileLinkOwnershipMock.mockRejectedValue(new NotFoundError("link not found"));

    await expect(linksApi.deleteLink(USER_ID, LINK_ID)).rejects.toBeInstanceOf(NotFoundError);

    expect(mocks.deleteMock).not.toHaveBeenCalled();
  });
});
