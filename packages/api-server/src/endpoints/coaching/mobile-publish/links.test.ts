import { beforeEach, describe, expect, it, vi } from "vitest";

import { linksApi } from "./links";

const COACH_PROFILE_ID = "clcoach000000000000000000";
const USER_ID = "cluser0000000000000000000";
const PLAN_ID = "clplan0000000000000000000";
const LINK_ID = "cllink0000000000000000000";
const NOW = new Date("2026-01-05T00:00:00.000Z");

const mocks = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  deleteMock: vi.fn(),
  resolveCoachIdMock: vi.fn(),
  verifyPlanOwnershipMock: vi.fn(),
  verifyMobileLinkOwnershipMock: vi.fn(),
}));

vi.mock("../../../db/client", () => ({
  prisma: {
    mobilePublishLink: { findMany: mocks.findManyMock, delete: mocks.deleteMock },
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
  connectionId: "clconn0000000000000000000",
  planId: PLAN_ID,
  channel: "GENERAL" as const,
  legacyLevelId: 2,
  createdAt: NOW,
  updatedAt: NOW,
});

describe("linksApi.listLinks", () => {
  beforeEach(() => {
    mocks.findManyMock.mockReset();
    mocks.resolveCoachIdMock.mockReset();
    mocks.verifyPlanOwnershipMock.mockReset();
    mocks.resolveCoachIdMock.mockResolvedValue(COACH_PROFILE_ID);
    mocks.verifyPlanOwnershipMock.mockResolvedValue(undefined);
    mocks.findManyMock.mockResolvedValue([makePrismaLink()]);
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
        legacyLevelId: 2,
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
