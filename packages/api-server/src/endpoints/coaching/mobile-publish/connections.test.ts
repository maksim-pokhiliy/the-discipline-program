import { beforeEach, describe, expect, it, vi } from "vitest";

import { type LegacyMobileClientPort } from "../../../infrastructure/legacy-mobile";
import { decrypt } from "../../../utils/token-cipher";

import { createConnectionsApi } from "./connections";

const RAW_TOKEN = "raw-legacy-access-token-value";
const COACH_PROFILE_ID = "clcoach000000000000000000";
const USER_ID = "cluser0000000000000000000";

const mocks = vi.hoisted(() => ({
  upsertMock: vi.fn(),
  resolveCoachIdMock: vi.fn(),
}));

vi.mock("../../../db/client", () => ({
  prisma: {
    mobileConnection: { upsert: mocks.upsertMock, findMany: vi.fn() },
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
  signin: vi.fn(async () => ({
    userId: "99",
    accessToken: RAW_TOKEN,
    userRoleName: "ADMIN",
    userPlanName: "General",
  })),
  getTrainingLevels: vi.fn(async () => []),
  getGeneralProgram: vi.fn(async () => null),
  createGeneralProgram: vi.fn(),
  updateGeneralProgram: vi.fn(),
  getIndividualProgram: vi.fn(async () => null),
  createIndividualProgram: vi.fn(),
  deleteIndividualProgram: vi.fn(),
  getIndividualAthletes: vi.fn(async () => []),
});

describe("createConnectionsApi.connect", () => {
  beforeEach(() => {
    mocks.upsertMock.mockReset();
    mocks.resolveCoachIdMock.mockReset();
    mocks.resolveCoachIdMock.mockResolvedValue(COACH_PROFILE_ID);
    mocks.upsertMock.mockImplementation(
      async ({ create }: { create: Record<string, unknown> }) => ({
        id: "clconn00000000000000000000",
        coachProfileId: COACH_PROFILE_ID,
        encryptedToken: create.encryptedToken,
        legacyUserId: create.legacyUserId,
        legacyUserName: create.legacyUserName,
        legacyUserRole: create.legacyUserRole,
        expiresAt: create.expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });

  it("encrypts the legacy token before persisting it", async () => {
    const api = createConnectionsApi(makeFakeLegacyClient());

    await api.connect(USER_ID, { email: "coach@example.com", password: "secret" });

    expect(mocks.upsertMock).toHaveBeenCalledTimes(1);
    const persisted = mocks.upsertMock.mock.calls[0]?.[0]?.create.encryptedToken as string;

    expect(persisted).not.toBe(RAW_TOKEN);
    expect(persisted).not.toContain(RAW_TOKEN);
    expect(decrypt(persisted)).toBe(RAW_TOKEN);
  });

  it("returns a DTO with no token field (G2 security invariant)", async () => {
    const api = createConnectionsApi(makeFakeLegacyClient());

    const result = await api.connect(USER_ID, { email: "coach@example.com", password: "secret" });

    expect(result).not.toHaveProperty("encryptedToken");
    expect(result).not.toHaveProperty("token");
    expect(result.legacyUserRole).toBe("ADMIN");
  });

  it("stores no connection when the legacy credentials are rejected (QA-#16)", async () => {
    const { UnauthorizedError } = await import("@repo/errors");
    const legacyClient = makeFakeLegacyClient();

    vi.mocked(legacyClient.signin).mockRejectedValue(new UnauthorizedError("bad credentials"));
    const api = createConnectionsApi(legacyClient);

    await expect(
      api.connect(USER_ID, { email: "coach@example.com", password: "wrong" }),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    expect(mocks.upsertMock).not.toHaveBeenCalled();
  });
});
