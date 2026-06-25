import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type LegacyGeneralProgram,
  type LegacyMobileClientPort,
} from "../../../infrastructure/legacy-mobile";

import { type MobilePublishDayPayload } from "./day-include";
import { publishDay } from "./publish-day";

const NOW = new Date("2026-06-08T00:00:00Z");
const LINK_ID = "cllink0000000000000000000";
const LEGACY_LEVEL_ID = 7;
const RACED_ROW_ID = 555;

const cuid = (suffix: string): string => `clz${suffix}`.padEnd(25, "0").slice(0, 25);

const mocks = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  upsertMock: vi.fn(),
}));

vi.mock("../../../db/client", () => ({
  prisma: {
    mobilePublishedDay: { findUnique: mocks.findUniqueMock, upsert: mocks.upsertMock },
    $disconnect: vi.fn(),
  },
}));

vi.mock("@repo/shared", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const restDay = (): MobilePublishDayPayload => ({
  id: cuid("day"),
  weekId: cuid("week"),
  dayOfWeek: "MONDAY",
  labelId: cuid("restlbl"),
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  week: { startDate: NOW },
  label: {
    id: cuid("restlbl"),
    name: "Rest",
    nameLower: "rest",
    applicableLevels: ["DAY"],
    notes: null,
    rest: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  sessions: [],
});

const racedRow = (): LegacyGeneralProgram => ({
  id: RACED_ROW_ID,
  scheduledDate: "2026-06-08",
  trainingLevelId: LEGACY_LEVEL_ID,
  isRestDay: true,
  dailyProgram: null,
});

const makeFakeClient = (): LegacyMobileClientPort => ({
  signin: vi.fn(),
  getTrainingLevels: vi.fn(),
  getGeneralProgram: vi.fn<LegacyMobileClientPort["getGeneralProgram"]>(),
  createGeneralProgram: vi.fn(),
  updateGeneralProgram: vi.fn(),
});

describe("publishDay 409-race path", () => {
  beforeEach(() => {
    mocks.findUniqueMock.mockReset();
    mocks.upsertMock.mockReset();
    mocks.findUniqueMock.mockResolvedValue(null);
    mocks.upsertMock.mockResolvedValue({ id: cuid("rec") });
  });

  it("falls back to PUT and reports updated when the POST races a 409", async () => {
    const { ConflictError } = await import("@repo/errors");
    const legacyClient = makeFakeClient();

    vi.mocked(legacyClient.getGeneralProgram)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(racedRow());
    vi.mocked(legacyClient.createGeneralProgram).mockRejectedValue(
      new ConflictError("already exists"),
    );
    vi.mocked(legacyClient.updateGeneralProgram).mockResolvedValue(racedRow());

    const result = await publishDay({
      legacyClient,
      token: "decrypted-token",
      linkId: LINK_ID,
      legacyLevelId: LEGACY_LEVEL_ID,
      weekStartDate: NOW,
      day: restDay(),
      exerciseById: new Map(),
      overwriteUnowned: false,
    });

    expect(legacyClient.createGeneralProgram).toHaveBeenCalledTimes(1);
    expect(legacyClient.updateGeneralProgram).toHaveBeenCalledTimes(1);
    expect(vi.mocked(legacyClient.updateGeneralProgram).mock.calls[0]?.[1]).toMatchObject({
      id: RACED_ROW_ID,
    });
    expect(result.action).toBe("updated");
    expect(result.legacyRowId).toBe(RACED_ROW_ID);
    expect(mocks.upsertMock).toHaveBeenCalledTimes(1);
  });
});
