import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError } from "@repo/errors";

import { type MobilePublishDayPayload } from "./day-include";
import { createPublishApi } from "./publish";

const NOW = new Date("2026-06-08T00:00:00Z");
const USER_ID = "cluser0000000000000000000";
const PLAN_ID = "clplan0000000000000000000";
const LINK_ID = "cllink0000000000000000000";
const START_DATE = "2026-06-08";
const BROKEN_DAY_ID = "clzbrokenday0000000000000";
const MINTED_ROW_ID = 1_000_000;

const mocks = vi.hoisted(() => ({
  verifyMobileLinkOwnershipMock: vi.fn(),
  loadTargetDaysMock: vi.fn(),
  loadExerciseByIdMock: vi.fn(),
  findUniqueMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  warnMock: vi.fn(),
  projectDayMock: vi.fn(),
}));

vi.mock("../../../db/client", () => ({
  prisma: {
    mobilePublishedDay: {
      findUnique: mocks.findUniqueMock,
      create: mocks.createMock,
      update: mocks.updateMock,
    },
    $disconnect: vi.fn(),
  },
}));

vi.mock("../../../authz/guards", () => ({
  verifyMobileLinkOwnership: mocks.verifyMobileLinkOwnershipMock,
}));

vi.mock("./publish-loaders", () => ({
  loadTargetDays: mocks.loadTargetDaysMock,
  loadExerciseById: mocks.loadExerciseByIdMock,
}));

vi.mock("./projection/project-day", () => ({
  projectDay: mocks.projectDayMock,
}));

vi.mock("@repo/shared", () => ({
  logger: { info: vi.fn(), warn: mocks.warnMock, error: vi.fn() },
}));

const makeDay = (
  id: string,
  dayOfWeek: MobilePublishDayPayload["dayOfWeek"],
): MobilePublishDayPayload => ({
  id,
  weekId: "clzweek000000000000000000",
  dayOfWeek,
  labelId: null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  week: { startDate: NOW },
  label: null,
  sessions: [],
});

describe("createPublishApi().publish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyMobileLinkOwnershipMock.mockResolvedValue({ planId: PLAN_ID });
    mocks.loadExerciseByIdMock.mockResolvedValue(new Map());
    mocks.findUniqueMock.mockResolvedValue(null);
    mocks.createMock.mockResolvedValue({ legacyRowId: MINTED_ROW_ID });
    mocks.projectDayMock.mockImplementation((day: MobilePublishDayPayload) => {
      if (day.id === BROKEN_DAY_ID) {
        throw new Error("projection exploded");
      }

      return { isRestDay: true };
    });
  });

  it("reports a throwing day as failed and still publishes the days around it", async () => {
    mocks.loadTargetDaysMock.mockResolvedValue([
      makeDay("clzwednesday0000000000000", "WEDNESDAY"),
      makeDay(BROKEN_DAY_ID, "TUESDAY"),
      makeDay("clzmonday000000000000000", "MONDAY"),
    ]);

    const result = await createPublishApi().publish(USER_ID, {
      linkId: LINK_ID,
      startDate: START_DATE,
      scope: "week",
    });

    expect(result.results).toEqual([
      { scheduledDate: "2026-06-08", action: "created", legacyRowId: MINTED_ROW_ID },
      { scheduledDate: "2026-06-09", action: "failed", legacyRowId: null },
      { scheduledDate: "2026-06-10", action: "created", legacyRowId: MINTED_ROW_ID },
    ]);
    expect(mocks.createMock).toHaveBeenCalledTimes(2);
    expect(mocks.warnMock).toHaveBeenCalledWith("mobile.publish.day_failed", {
      linkId: LINK_ID,
      scheduledDate: "2026-06-09",
      code: "unknown",
    });
  });

  it("loads the days of the plan the link belongs to", async () => {
    mocks.loadTargetDaysMock.mockResolvedValue([]);

    await createPublishApi().publish(USER_ID, {
      linkId: LINK_ID,
      startDate: START_DATE,
      scope: "week",
    });

    expect(mocks.verifyMobileLinkOwnershipMock).toHaveBeenCalledWith(LINK_ID, USER_ID);
    expect(mocks.loadTargetDaysMock).toHaveBeenCalledWith(PLAN_ID, NOW, undefined);
  });

  it("writes nothing when the caller does not own the link", async () => {
    mocks.verifyMobileLinkOwnershipMock.mockRejectedValue(
      new ForbiddenError("Resource does not belong to this coach"),
    );

    await expect(
      createPublishApi().publish(USER_ID, {
        linkId: LINK_ID,
        startDate: START_DATE,
        scope: "week",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(mocks.loadTargetDaysMock).not.toHaveBeenCalled();
    expect(mocks.createMock).not.toHaveBeenCalled();
  });
});
