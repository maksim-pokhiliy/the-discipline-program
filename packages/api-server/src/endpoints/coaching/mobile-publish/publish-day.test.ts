import { beforeEach, describe, expect, it, vi } from "vitest";

import { type ChannelProgramOps, type LegacyProgramRow } from "./channel-program-ops";
import { type MobilePublishDayPayload } from "./day-include";
import { type PublishDayArgs, publishDay } from "./publish-day";

const NOW = new Date("2026-06-08T00:00:00Z");
const SCHEDULED_DATE = "2026-06-08";
const LINK_ID = "cllink0000000000000000000";
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

const restLegacyRow = (): LegacyProgramRow => ({
  id: RACED_ROW_ID,
  isRestDay: true,
  dailyProgram: null,
});

const nonRestLegacyRow = (): LegacyProgramRow => ({
  id: RACED_ROW_ID,
  isRestDay: false,
  dailyProgram: { dayTrainings: [] },
});

const makeFakeOps = (): ChannelProgramOps => ({
  getProgram: vi.fn<ChannelProgramOps["getProgram"]>(),
  createProgram: vi.fn(),
  replaceProgram: vi.fn(),
});

const baseArgs = (
  ops: ChannelProgramOps,
  overrides: Partial<PublishDayArgs> = {},
): PublishDayArgs => ({
  ops,
  linkId: LINK_ID,
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
    const ops = makeFakeOps();

    mocks.findUniqueMock.mockResolvedValue({ id: OWNED_RECORD_ID });
    vi.mocked(ops.getProgram).mockResolvedValueOnce(null).mockResolvedValueOnce(nonRestLegacyRow());
    vi.mocked(ops.createProgram).mockRejectedValue(new ConflictError("already exists"));
    vi.mocked(ops.replaceProgram).mockResolvedValue(nonRestLegacyRow());

    const result = await publishDay(baseArgs(ops));

    expect(ops.createProgram).toHaveBeenCalledTimes(1);
    expect(ops.replaceProgram).toHaveBeenCalledTimes(1);
    expect(vi.mocked(ops.replaceProgram).mock.calls[0]?.[1]).toBe(RACED_ROW_ID);
    expect(result.action).toBe("updated");
    expect(result.legacyRowId).toBe(RACED_ROW_ID);
    expect(mocks.upsertMock).toHaveBeenCalledTimes(1);
  });

  it("conflicts without writing when an unowned day races a 409 and overwrite is off", async () => {
    const { ConflictError } = await import("@repo/errors");
    const ops = makeFakeOps();

    vi.mocked(ops.getProgram).mockResolvedValueOnce(null).mockResolvedValueOnce(nonRestLegacyRow());
    vi.mocked(ops.createProgram).mockRejectedValue(new ConflictError("already exists"));

    const result = await publishDay(baseArgs(ops, { overwriteUnowned: false }));

    expect(ops.createProgram).toHaveBeenCalledTimes(1);
    expect(ops.replaceProgram).not.toHaveBeenCalled();
    expect(result.action).toBe("conflict");
    expect(result.legacyRowId).toBe(RACED_ROW_ID);
    expect(mocks.upsertMock).not.toHaveBeenCalled();
  });

  it("throws ConflictError without re-posting when the 409 re-GET returns null (QA-#22)", async () => {
    const { ConflictError } = await import("@repo/errors");
    const ops = makeFakeOps();

    vi.mocked(ops.getProgram).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    vi.mocked(ops.createProgram).mockRejectedValue(new ConflictError("already exists"));

    await expect(publishDay(baseArgs(ops))).rejects.toBeInstanceOf(ConflictError);

    expect(ops.createProgram).toHaveBeenCalledTimes(1);
    expect(ops.replaceProgram).not.toHaveBeenCalled();
    expect(mocks.upsertMock).not.toHaveBeenCalled();
  });

  it("skips without writing when the live legacy content matches the projection", async () => {
    const ops = makeFakeOps();

    mocks.findUniqueMock.mockResolvedValue({ id: OWNED_RECORD_ID });
    vi.mocked(ops.getProgram).mockResolvedValue(restLegacyRow());

    const result = await publishDay(baseArgs(ops));

    expect(ops.createProgram).not.toHaveBeenCalled();
    expect(ops.replaceProgram).not.toHaveBeenCalled();
    expect(result.action).toBe("skipped");
    expect(result.legacyRowId).toBe(RACED_ROW_ID);
    expect(mocks.upsertMock).not.toHaveBeenCalled();
  });

  it("claims the ledger when a content-identical legacy row is unowned (skip, not conflict)", async () => {
    const ops = makeFakeOps();

    mocks.findUniqueMock.mockResolvedValue(null);
    vi.mocked(ops.getProgram).mockResolvedValue(restLegacyRow());

    const result = await publishDay(baseArgs(ops, { overwriteUnowned: false }));

    expect(result.action).toBe("skipped");
    expect(ops.createProgram).not.toHaveBeenCalled();
    expect(ops.replaceProgram).not.toHaveBeenCalled();
    expect(mocks.upsertMock).toHaveBeenCalledTimes(1);
  });
});
