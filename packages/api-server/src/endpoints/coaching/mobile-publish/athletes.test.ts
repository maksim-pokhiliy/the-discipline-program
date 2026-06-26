import { beforeEach, describe, expect, it, vi } from "vitest";

import { type LegacyMobileClientPort } from "../../../infrastructure/legacy-mobile";
import { encrypt } from "../../../utils/token-cipher";

import { createAthletesApi } from "./athletes";

const RAW_TOKEN = "raw-legacy-access-token-value";
const COACH_PROFILE_ID = "clcoach000000000000000000";
const USER_ID = "cluser0000000000000000000";

const ATHLETES = [{ id: 5, username: "athlete@tdp.local", firstName: "Test", lastName: "Athlete" }];

const mocks = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  resolveCoachIdMock: vi.fn(),
}));

vi.mock("../../../db/client", () => ({
  prisma: {
    mobileConnection: { findUnique: mocks.findUniqueMock },
    $disconnect: vi.fn(),
  },
}));

vi.mock("../../../authz/guards", () => ({
  resolveCoachId: mocks.resolveCoachIdMock,
}));

vi.mock("@repo/shared", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const makeFakeLegacyClient = (): LegacyMobileClientPort => ({
  signin: vi.fn(),
  getTrainingLevels: vi.fn(async () => []),
  getGeneralProgram: vi.fn(async () => null),
  createGeneralProgram: vi.fn(),
  updateGeneralProgram: vi.fn(),
  getIndividualProgram: vi.fn(async () => null),
  createIndividualProgram: vi.fn(),
  deleteIndividualProgram: vi.fn(),
  getIndividualAthletes: vi.fn(async () => ATHLETES),
});

describe("createAthletesApi.listIndividualAthletes", () => {
  beforeEach(() => {
    mocks.findUniqueMock.mockReset();
    mocks.resolveCoachIdMock.mockReset();
    mocks.resolveCoachIdMock.mockResolvedValue(COACH_PROFILE_ID);
    mocks.findUniqueMock.mockResolvedValue({ encryptedToken: encrypt(RAW_TOKEN) });
  });

  it("decrypts the stored token and returns the legacy athletes for a connected coach", async () => {
    const legacyClient = makeFakeLegacyClient();
    const api = createAthletesApi(legacyClient);

    const result = await api.listIndividualAthletes(USER_ID);

    expect(result).toEqual(ATHLETES);
    expect(legacyClient.getIndividualAthletes).toHaveBeenCalledWith(RAW_TOKEN);
  });

  it("returns an empty list when the coach has no individual athletes", async () => {
    const legacyClient = makeFakeLegacyClient();

    vi.mocked(legacyClient.getIndividualAthletes).mockResolvedValue([]);
    const api = createAthletesApi(legacyClient);

    const result = await api.listIndividualAthletes(USER_ID);

    expect(result).toEqual([]);
  });

  it("throws a BadRequestError when the coach is not connected", async () => {
    const { BadRequestError } = await import("@repo/errors");

    mocks.findUniqueMock.mockResolvedValue(null);
    const legacyClient = makeFakeLegacyClient();
    const api = createAthletesApi(legacyClient);

    await expect(api.listIndividualAthletes(USER_ID)).rejects.toBeInstanceOf(BadRequestError);

    expect(legacyClient.getIndividualAthletes).not.toHaveBeenCalled();
  });

  it("surfaces a reconnect signal without leaking the token when the legacy session is rejected", async () => {
    const { UnauthorizedError } = await import("@repo/errors");
    const legacyClient = makeFakeLegacyClient();

    vi.mocked(legacyClient.getIndividualAthletes).mockRejectedValue(
      new UnauthorizedError("legacy 401"),
    );
    const api = createAthletesApi(legacyClient);

    await expect(api.listIndividualAthletes(USER_ID)).rejects.toBeInstanceOf(UnauthorizedError);

    await api.listIndividualAthletes(USER_ID).catch((error: unknown) => {
      expect(error).toBeInstanceOf(UnauthorizedError);

      if (error instanceof UnauthorizedError) {
        expect(error.message).toBe("Mobile session expired — please reconnect");
        expect(error.message).not.toContain(RAW_TOKEN);
      }
    });
  });
});
