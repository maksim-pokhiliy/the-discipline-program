import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InternalServerError } from "@repo/errors";

import { dayContentHash } from "./day-content-hash";
import { type MobilePublishDayPayload } from "./day-include";
import { type PublishDayArgs, publishDay } from "./publish-day";

const NOW = new Date("2026-06-08T00:00:00Z");
const SCHEDULED_DATE = "2026-06-08";
const LINK_ID = "cllink0000000000000000000";
const MINTED_ROW_ID = 1_000_000;
const STORED_ROW_ID = 1_000_042;
const STORED_DAY_ID = "clzstoredday0000000000000";
const OTHER_DAY_ID = "clzotherday00000000000000";
const LEVEL_PRO = 2;
const REST_HASH = dayContentHash({ isRestDay: true });
const STALE_HASH = "hash-of-an-older-projection";

const cuid = (suffix: string): string => `clz${suffix}`.padEnd(25, "0").slice(0, 25);

const mocks = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  findFirstMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock("../../../db/client", () => ({
  prisma: {
    mobilePublishedDay: {
      findUnique: mocks.findUniqueMock,
      findFirst: mocks.findFirstMock,
      create: mocks.createMock,
      update: mocks.updateMock,
    },
    $disconnect: vi.fn(),
  },
}));

vi.mock("@repo/shared", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const restLabel = {
  id: cuid("restlbl"),
  name: "Rest",
  nameLower: "rest",
  applicableLevels: ["DAY" as const],
  notes: null,
  rest: true,
  createdAt: NOW,
  updatedAt: NOW,
};

const makeDay = (isRest: boolean): MobilePublishDayPayload => ({
  id: cuid("day"),
  weekId: cuid("week"),
  dayOfWeek: "MONDAY",
  labelId: isRest ? restLabel.id : null,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
  week: { startDate: NOW },
  label: isRest ? restLabel : null,
  sessions: [],
});

const baseArgs = (overrides: Partial<PublishDayArgs> = {}): PublishDayArgs => ({
  linkId: LINK_ID,
  audience: { channel: "GENERAL", legacyLevelId: LEVEL_PRO },
  scheduledDate: SCHEDULED_DATE,
  absoluteDate: NOW,
  day: makeDay(true),
  exerciseById: new Map(),
  ...overrides,
});

const uniqueViolation = (): Prisma.PrismaClientKnownRequestError =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "6.0.0",
    meta: { target: ["linkId", "scheduledDate"] },
  });

type WriteCall = { data: Record<string, unknown> };

const firstCallData = (mock: ReturnType<typeof vi.fn>): Record<string, unknown> => {
  const call = mock.mock.calls[0]?.[0] as WriteCall | undefined;

  return call?.data ?? {};
};

describe("publishDay", () => {
  beforeEach(() => {
    mocks.findUniqueMock.mockReset();
    mocks.createMock.mockReset();
    mocks.updateMock.mockReset();
    mocks.findFirstMock.mockReset();
    mocks.findUniqueMock.mockResolvedValue(null);
    mocks.findFirstMock.mockResolvedValue({ id: STORED_DAY_ID });
    mocks.createMock.mockResolvedValue({ legacyRowId: MINTED_ROW_ID });
    mocks.updateMock.mockResolvedValue({ legacyRowId: STORED_ROW_ID });
  });

  it("creates a new row without supplying the wire id and reports the minted one", async () => {
    const result = await publishDay(baseArgs());

    expect(result).toEqual({
      scheduledDate: SCHEDULED_DATE,
      action: "created",
      legacyRowId: MINTED_ROW_ID,
    });
    expect(firstCallData(mocks.createMock)).not.toHaveProperty("legacyRowId");
    expect(firstCallData(mocks.createMock)).toMatchObject({
      linkId: LINK_ID,
      scheduledDate: NOW,
      contentHash: REST_HASH,
      isRestDay: true,
    });
  });

  it("stores a rest day as Prisma.DbNull so the rest_xor_program CHECK accepts it", async () => {
    await publishDay(baseArgs());

    expect(firstCallData(mocks.createMock).dailyProgram).toBe(Prisma.DbNull);
  });

  it("stores a training day with isRestDay false and its projected program", async () => {
    await publishDay(baseArgs({ day: makeDay(false) }));

    expect(firstCallData(mocks.createMock)).toMatchObject({
      isRestDay: false,
      dailyProgram: { dayTrainings: [] },
    });
  });

  it("skips without any write when the stored content carries the projection's hash", async () => {
    mocks.findUniqueMock.mockResolvedValue({
      id: STORED_DAY_ID,
      legacyRowId: STORED_ROW_ID,
      contentHash: REST_HASH,
      isRestDay: true,
    });

    const result = await publishDay(baseArgs());

    expect(result).toEqual({
      scheduledDate: SCHEDULED_DATE,
      action: "skipped",
      legacyRowId: STORED_ROW_ID,
    });
    expect(mocks.createMock).not.toHaveBeenCalled();
    expect(mocks.updateMock).not.toHaveBeenCalled();
  });

  it("reclaims the day when another link's newer row is served for the same audience", async () => {
    mocks.findUniqueMock.mockResolvedValue({
      id: STORED_DAY_ID,
      legacyRowId: STORED_ROW_ID,
      contentHash: REST_HASH,
      isRestDay: true,
    });
    mocks.findFirstMock.mockResolvedValue({ id: OTHER_DAY_ID });

    const result = await publishDay(baseArgs());

    expect(result).toEqual({
      scheduledDate: SCHEDULED_DATE,
      action: "updated",
      legacyRowId: STORED_ROW_ID,
    });
    expect(firstCallData(mocks.updateMock)).not.toHaveProperty("legacyRowId");
    expect(firstCallData(mocks.updateMock).publishedAt).toBeInstanceOf(Date);
  });

  it("looks up the served row the way the app's read path picks it", async () => {
    mocks.findUniqueMock.mockResolvedValue({
      id: STORED_DAY_ID,
      legacyRowId: STORED_ROW_ID,
      contentHash: REST_HASH,
      isRestDay: true,
    });

    await publishDay(
      baseArgs({ audience: { channel: "INDIVIDUAL", legacyUserId: STORED_ROW_ID } }),
    );

    expect(mocks.findFirstMock).toHaveBeenCalledWith({
      where: {
        scheduledDate: NOW,
        isRestDay: { not: null },
        link: { channel: "INDIVIDUAL", legacyUserId: STORED_ROW_ID },
      },
      orderBy: [{ publishedAt: "desc" }, { legacyRowId: "desc" }],
      select: { id: true },
    });
  });

  it("updates content, hash and publishedAt but never the wire id when the hash differs", async () => {
    mocks.findUniqueMock.mockResolvedValue({
      id: STORED_DAY_ID,
      legacyRowId: STORED_ROW_ID,
      contentHash: STALE_HASH,
      isRestDay: false,
    });

    const result = await publishDay(baseArgs());

    expect(result).toEqual({
      scheduledDate: SCHEDULED_DATE,
      action: "updated",
      legacyRowId: STORED_ROW_ID,
    });
    expect(mocks.createMock).not.toHaveBeenCalled();

    const data = firstCallData(mocks.updateMock);

    expect(data).not.toHaveProperty("legacyRowId");
    expect(data).toMatchObject({ contentHash: REST_HASH, isRestDay: true });
    expect(data.dailyProgram).toBe(Prisma.DbNull);
    expect(data.publishedAt).toBeInstanceOf(Date);
  });

  it("fills a content-less row even when its hash already matches", async () => {
    mocks.findUniqueMock.mockResolvedValue({
      id: STORED_DAY_ID,
      legacyRowId: STORED_ROW_ID,
      contentHash: REST_HASH,
      isRestDay: null,
    });

    const result = await publishDay(baseArgs());

    expect(result.action).toBe("updated");
    expect(mocks.updateMock).toHaveBeenCalledTimes(1);
  });

  it("re-decides against the row a concurrent run inserted and skips an identical one", async () => {
    mocks.findUniqueMock.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: STORED_DAY_ID,
      legacyRowId: STORED_ROW_ID,
      contentHash: REST_HASH,
      isRestDay: true,
    });
    mocks.createMock.mockRejectedValue(uniqueViolation());

    const result = await publishDay(baseArgs());

    expect(result).toEqual({
      scheduledDate: SCHEDULED_DATE,
      action: "skipped",
      legacyRowId: STORED_ROW_ID,
    });
    expect(mocks.createMock).toHaveBeenCalledTimes(1);
    expect(mocks.updateMock).not.toHaveBeenCalled();
  });

  it("re-decides against the row a concurrent run inserted and updates a different one", async () => {
    mocks.findUniqueMock.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: STORED_DAY_ID,
      legacyRowId: STORED_ROW_ID,
      contentHash: STALE_HASH,
      isRestDay: false,
    });
    mocks.createMock.mockRejectedValue(uniqueViolation());

    const result = await publishDay(baseArgs());

    expect(result.action).toBe("updated");
    expect(mocks.createMock).toHaveBeenCalledTimes(1);
    expect(mocks.updateMock).toHaveBeenCalledTimes(1);
  });

  it("throws when the concurrently inserted row is gone on the re-read", async () => {
    mocks.createMock.mockRejectedValue(uniqueViolation());

    await expect(publishDay(baseArgs())).rejects.toBeInstanceOf(InternalServerError);
    expect(mocks.createMock).toHaveBeenCalledTimes(1);
  });

  it("rethrows a create failure that is not a unique violation", async () => {
    const failure = new Error("connection reset");

    mocks.createMock.mockRejectedValue(failure);

    await expect(publishDay(baseArgs())).rejects.toBe(failure);
    expect(mocks.findUniqueMock).toHaveBeenCalledTimes(1);
  });
});
