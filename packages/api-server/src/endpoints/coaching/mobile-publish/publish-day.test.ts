import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type LegacyGeneralProgram,
  type LegacyMobileClientPort,
} from "../../../infrastructure/legacy-mobile";

import { type MobilePublishDayPayload } from "./day-include";
import { type PublishDayArgs, publishDay } from "./publish-day";

const NOW = new Date("2026-06-08T00:00:00Z");
const SCHEDULED_DATE = "2026-06-08";
const LINK_ID = "cllink0000000000000000000";
const LEGACY_LEVEL_ID = 7;
const RACED_ROW_ID = 555;
const OWNED_RECORD_ID = "clrec0000000000000000000";

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

const restLegacyRow = (): LegacyGeneralProgram => ({
  id: RACED_ROW_ID,
  scheduledDate: SCHEDULED_DATE,
  trainingLevelId: LEGACY_LEVEL_ID,
  isRestDay: true,
  dailyProgram: null,
});

const nonRestLegacyRow = (): LegacyGeneralProgram => ({
  id: RACED_ROW_ID,
  scheduledDate: SCHEDULED_DATE,
  trainingLevelId: LEGACY_LEVEL_ID,
  isRestDay: false,
  dailyProgram: { dayTrainings: [] },
});

const makeFakeClient = (): LegacyMobileClientPort => ({
  signin: vi.fn(),
  getTrainingLevels: vi.fn(),
  getGeneralProgram: vi.fn<LegacyMobileClientPort["getGeneralProgram"]>(),
  createGeneralProgram: vi.fn(),
  updateGeneralProgram: vi.fn(),
});

const baseArgs = (
  legacyClient: LegacyMobileClientPort,
  overrides: Partial<PublishDayArgs> = {},
): PublishDayArgs => ({
  legacyClient,
  token: "decrypted-token",
  linkId: LINK_ID,
  legacyLevelId: LEGACY_LEVEL_ID,
  scheduledDate: SCHEDULED_DATE,
  absoluteDate: NOW,
  day: restDay(),
  exerciseById: new Map(),
  overwriteUnowned: false,
  ...overrides,
});

describe("publishDay", () => {
  beforeEach(() => {
    mocks.findUniqueMock.mockReset();
    mocks.upsertMock.mockReset();
    mocks.findUniqueMock.mockResolvedValue(null);
    mocks.upsertMock.mockResolvedValue({ id: cuid("rec") });
  });

  it("falls back to PUT and reports updated when an owned day races a 409", async () => {
    const { ConflictError } = await import("@repo/errors");
    const legacyClient = makeFakeClient();

    mocks.findUniqueMock.mockResolvedValue({ id: OWNED_RECORD_ID });
    vi.mocked(legacyClient.getGeneralProgram)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(nonRestLegacyRow());
    vi.mocked(legacyClient.createGeneralProgram).mockRejectedValue(
      new ConflictError("already exists"),
    );
    vi.mocked(legacyClient.updateGeneralProgram).mockResolvedValue(nonRestLegacyRow());

    const result = await publishDay(baseArgs(legacyClient));

    expect(legacyClient.createGeneralProgram).toHaveBeenCalledTimes(1);
    expect(legacyClient.updateGeneralProgram).toHaveBeenCalledTimes(1);
    expect(vi.mocked(legacyClient.updateGeneralProgram).mock.calls[0]?.[1]).toMatchObject({
      id: RACED_ROW_ID,
    });
    expect(result.action).toBe("updated");
    expect(result.legacyRowId).toBe(RACED_ROW_ID);
    expect(mocks.upsertMock).toHaveBeenCalledTimes(1);
  });

  it("conflicts without writing when an unowned day races a 409 and overwrite is off", async () => {
    const { ConflictError } = await import("@repo/errors");
    const legacyClient = makeFakeClient();

    vi.mocked(legacyClient.getGeneralProgram)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(nonRestLegacyRow());
    vi.mocked(legacyClient.createGeneralProgram).mockRejectedValue(
      new ConflictError("already exists"),
    );

    const result = await publishDay(baseArgs(legacyClient, { overwriteUnowned: false }));

    expect(legacyClient.createGeneralProgram).toHaveBeenCalledTimes(1);
    expect(legacyClient.updateGeneralProgram).not.toHaveBeenCalled();
    expect(result.action).toBe("conflict");
    expect(result.legacyRowId).toBe(RACED_ROW_ID);
    expect(mocks.upsertMock).not.toHaveBeenCalled();
  });

  it("throws ConflictError without re-posting when the 409 re-GET returns null (QA-#22)", async () => {
    const { ConflictError } = await import("@repo/errors");
    const legacyClient = makeFakeClient();

    vi.mocked(legacyClient.getGeneralProgram)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    vi.mocked(legacyClient.createGeneralProgram).mockRejectedValue(
      new ConflictError("already exists"),
    );

    await expect(publishDay(baseArgs(legacyClient))).rejects.toBeInstanceOf(ConflictError);

    expect(legacyClient.createGeneralProgram).toHaveBeenCalledTimes(1);
    expect(legacyClient.updateGeneralProgram).not.toHaveBeenCalled();
    expect(mocks.upsertMock).not.toHaveBeenCalled();
  });

  it("skips without writing when the live legacy content matches the projection", async () => {
    const legacyClient = makeFakeClient();

    mocks.findUniqueMock.mockResolvedValue({ id: OWNED_RECORD_ID });
    vi.mocked(legacyClient.getGeneralProgram).mockResolvedValue(restLegacyRow());

    const result = await publishDay(baseArgs(legacyClient));

    expect(legacyClient.createGeneralProgram).not.toHaveBeenCalled();
    expect(legacyClient.updateGeneralProgram).not.toHaveBeenCalled();
    expect(result.action).toBe("skipped");
    expect(result.legacyRowId).toBe(RACED_ROW_ID);
    expect(mocks.upsertMock).not.toHaveBeenCalled();
  });

  it("claims the ledger when a content-identical legacy row is unowned (skip, not conflict)", async () => {
    const legacyClient = makeFakeClient();

    mocks.findUniqueMock.mockResolvedValue(null);
    vi.mocked(legacyClient.getGeneralProgram).mockResolvedValue(restLegacyRow());

    const result = await publishDay(baseArgs(legacyClient, { overwriteUnowned: false }));

    expect(result.action).toBe("skipped");
    expect(legacyClient.createGeneralProgram).not.toHaveBeenCalled();
    expect(legacyClient.updateGeneralProgram).not.toHaveBeenCalled();
    expect(mocks.upsertMock).toHaveBeenCalledTimes(1);
  });
});
