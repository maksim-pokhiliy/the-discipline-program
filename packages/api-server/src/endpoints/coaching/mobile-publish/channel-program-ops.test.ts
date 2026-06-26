import { MobilePublishChannel } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { BadGatewayError, InternalServerError } from "@repo/errors";

import {
  type LegacyIndividualProgram,
  type LegacyMobileClientPort,
} from "../../../infrastructure/legacy-mobile";

import { buildChannelOps, type LegacyProgramWriteBody } from "./channel-program-ops";

const TOKEN = "raw-legacy-token";
const LEGACY_USER_ID = 5;
const LEGACY_LEVEL_ID = 7;
const OLD_ROW_ID = 100;
const NEW_ROW_ID = 200;
const DATE = "2026-06-22";

const WRITE_BODY: LegacyProgramWriteBody = {
  scheduledDate: DATE,
  isRestDay: false,
  dailyProgram: { dayTrainings: [{ trainingNumber: 1, blocks: [] }] },
};

const individualRow = (id: number): LegacyIndividualProgram => ({
  id,
  userId: LEGACY_USER_ID,
  scheduledDate: DATE,
  isRestDay: false,
  dailyProgram: WRITE_BODY.dailyProgram,
});

const makeFakeLegacyClient = (): LegacyMobileClientPort => ({
  signin: vi.fn(),
  getTrainingLevels: vi.fn(async () => []),
  getGeneralProgram: vi.fn(async () => null),
  createGeneralProgram: vi.fn(),
  updateGeneralProgram: vi.fn(),
  getIndividualProgram: vi.fn(async () => null),
  createIndividualProgram: vi.fn(),
  deleteIndividualProgram: vi.fn(),
  getIndividualAthletes: vi.fn(async () => []),
});

const individualLink = {
  channel: MobilePublishChannel.INDIVIDUAL,
  legacyLevelId: null,
  legacyUserId: LEGACY_USER_ID,
};

const generalLink = {
  channel: MobilePublishChannel.GENERAL,
  legacyLevelId: LEGACY_LEVEL_ID,
  legacyUserId: null,
};

describe("buildChannelOps — INDIVIDUAL ops", () => {
  it("reads the individual program for the legacy user", async () => {
    const client = makeFakeLegacyClient();
    const ops = buildChannelOps(client, TOKEN, individualLink);

    await ops.getProgram(DATE);

    expect(client.getIndividualProgram).toHaveBeenCalledWith(TOKEN, LEGACY_USER_ID, DATE);
    expect(client.getGeneralProgram).not.toHaveBeenCalled();
  });

  it("creates with a flat userId body", async () => {
    const client = makeFakeLegacyClient();

    vi.mocked(client.createIndividualProgram).mockResolvedValue(individualRow(NEW_ROW_ID));
    const ops = buildChannelOps(client, TOKEN, individualLink);

    await ops.createProgram(WRITE_BODY);

    expect(client.createIndividualProgram).toHaveBeenCalledWith(TOKEN, {
      userId: LEGACY_USER_ID,
      ...WRITE_BODY,
    });
  });

  it("replaces by DELETE-then-POST and returns the new legacy row (D-15)", async () => {
    const client = makeFakeLegacyClient();

    vi.mocked(client.deleteIndividualProgram).mockResolvedValue(undefined);
    vi.mocked(client.createIndividualProgram).mockResolvedValue(individualRow(NEW_ROW_ID));
    const ops = buildChannelOps(client, TOKEN, individualLink);

    const result = await ops.replaceProgram(WRITE_BODY, OLD_ROW_ID);

    expect(client.deleteIndividualProgram).toHaveBeenCalledWith(TOKEN, OLD_ROW_ID);
    expect(client.createIndividualProgram).toHaveBeenCalledWith(TOKEN, {
      userId: LEGACY_USER_ID,
      ...WRITE_BODY,
    });
    expect(result.id).toBe(NEW_ROW_ID);
    expect(result.id).not.toBe(OLD_ROW_ID);

    const deleteOrder = vi.mocked(client.deleteIndividualProgram).mock.invocationCallOrder[0] ?? 0;
    const createOrder = vi.mocked(client.createIndividualProgram).mock.invocationCallOrder[0] ?? 0;

    expect(deleteOrder).toBeLessThan(createOrder);
  });

  it("has already DELETEd the row when the follow-up POST fails (D-15 data-loss window)", async () => {
    const client = makeFakeLegacyClient();

    vi.mocked(client.deleteIndividualProgram).mockResolvedValue(undefined);
    vi.mocked(client.createIndividualProgram).mockRejectedValue(new BadGatewayError("legacy down"));
    const ops = buildChannelOps(client, TOKEN, individualLink);

    await expect(ops.replaceProgram(WRITE_BODY, OLD_ROW_ID)).rejects.toBeInstanceOf(
      BadGatewayError,
    );

    expect(client.deleteIndividualProgram).toHaveBeenCalledWith(TOKEN, OLD_ROW_ID);
  });
});

describe("buildChannelOps — GENERAL ops (regression guard, no DELETE+POST leak)", () => {
  it("reads the general program for the level", async () => {
    const client = makeFakeLegacyClient();
    const ops = buildChannelOps(client, TOKEN, generalLink);

    await ops.getProgram(DATE);

    expect(client.getGeneralProgram).toHaveBeenCalledWith(TOKEN, LEGACY_LEVEL_ID, DATE);
    expect(client.getIndividualProgram).not.toHaveBeenCalled();
  });

  it("creates with a nested levelId body", async () => {
    const client = makeFakeLegacyClient();

    vi.mocked(client.createGeneralProgram).mockResolvedValue({
      id: NEW_ROW_ID,
      scheduledDate: DATE,
      trainingLevelId: LEGACY_LEVEL_ID,
      isRestDay: false,
      dailyProgram: WRITE_BODY.dailyProgram,
    });
    const ops = buildChannelOps(client, TOKEN, generalLink);

    await ops.createProgram(WRITE_BODY);

    expect(client.createGeneralProgram).toHaveBeenCalledWith(TOKEN, {
      levelId: LEGACY_LEVEL_ID,
      ...WRITE_BODY,
    });
  });

  it("replaces in place with a single PUT, keeping the same row id and never deleting", async () => {
    const client = makeFakeLegacyClient();

    vi.mocked(client.updateGeneralProgram).mockResolvedValue({
      id: OLD_ROW_ID,
      scheduledDate: DATE,
      trainingLevelId: LEGACY_LEVEL_ID,
      isRestDay: false,
      dailyProgram: WRITE_BODY.dailyProgram,
    });
    const ops = buildChannelOps(client, TOKEN, generalLink);

    const result = await ops.replaceProgram(WRITE_BODY, OLD_ROW_ID);

    expect(client.updateGeneralProgram).toHaveBeenCalledWith(TOKEN, {
      levelId: LEGACY_LEVEL_ID,
      id: OLD_ROW_ID,
      ...WRITE_BODY,
    });
    expect(client.deleteIndividualProgram).not.toHaveBeenCalled();
    expect(client.createGeneralProgram).not.toHaveBeenCalled();
    expect(result.id).toBe(OLD_ROW_ID);
  });
});

describe("buildChannelOps — fail-closed on a missing channel key", () => {
  it("throws InternalServerError for an INDIVIDUAL link with a null legacyUserId", () => {
    const client = makeFakeLegacyClient();

    expect(() =>
      buildChannelOps(client, TOKEN, {
        channel: MobilePublishChannel.INDIVIDUAL,
        legacyLevelId: null,
        legacyUserId: null,
      }),
    ).toThrow(InternalServerError);
  });

  it("throws InternalServerError for a GENERAL link with a null legacyLevelId", () => {
    const client = makeFakeLegacyClient();

    expect(() =>
      buildChannelOps(client, TOKEN, {
        channel: MobilePublishChannel.GENERAL,
        legacyLevelId: null,
        legacyUserId: null,
      }),
    ).toThrow(InternalServerError);
  });
});
