import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BadGatewayError, ConflictError, TimeoutError } from "@repo/errors";

import { createLegacyMobileRestAdapter } from "./rest-adapter";

const RAW_TOKEN = "raw-legacy-jwt-token";

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const errorResponse = (status: number): Response =>
  jsonResponse(status, { error: { message: `failed: ${status}` } });

const signinBody = {
  userId: 42,
  accessToken: "issued-token",
  userRole: { id: 1, name: "ADMIN" },
  userPlan: { id: 2, name: "PRO" },
};

const trainingDayProgram = {
  id: 100,
  scheduledDate: "2026-06-22",
  trainingLevel: { id: 7, name: "RX" },
  isRestDay: false,
  dailyProgram: {
    dayTrainings: [
      { trainingNumber: 1, blocks: [{ name: "Strength", exercises: ["Back Squat 5x5"] }] },
    ],
  },
};

const lastRequestInit = (fetchSpy: ReturnType<typeof vi.spyOn>): RequestInit => {
  const call = fetchSpy.mock.calls.at(-1);

  if (!call) {
    throw new Error("fetch was not called");
  }

  const init = call[1];

  if (!init) {
    throw new Error("fetch was called without an init object");
  }

  return init;
};

const headersOf = (init: RequestInit): Record<string, string> => {
  const { headers } = init;

  if (!headers || headers instanceof Headers || Array.isArray(headers)) {
    throw new Error("expected a plain record of headers");
  }

  return headers;
};

describe("createLegacyMobileRestAdapter", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe("signin", () => {
    it("POSTs without an Authorization header and parses the response", async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(200, signinBody));
      const adapter = createLegacyMobileRestAdapter();

      const result = await adapter.signin("coach@example.com", "secret");

      expect(result).toEqual({
        userId: "42",
        accessToken: "issued-token",
        userRoleName: "ADMIN",
        userPlanName: "PRO",
      });

      const init = lastRequestInit(fetchSpy);
      const headers = headersOf(init);

      expect(init.method).toBe("POST");
      expect(headers.Authorization).toBeUndefined();
      expect(init.body).toBe(JSON.stringify({ username: "coach@example.com", password: "secret" }));
    });

    it("coerces a numeric userId to a string", async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(200, { ...signinBody, userId: 99 }));
      const adapter = createLegacyMobileRestAdapter();

      const result = await adapter.signin("coach@example.com", "secret");

      expect(result.userId).toBe("99");
    });
  });

  describe("authed requests", () => {
    it("sends the raw token as Authorization with no Bearer prefix", async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(200, [{ id: 7, name: "RX" }]));
      const adapter = createLegacyMobileRestAdapter();

      const levels = await adapter.getTrainingLevels(RAW_TOKEN);

      expect(levels).toEqual([{ id: 7, name: "RX" }]);

      const headers = headersOf(lastRequestInit(fetchSpy));

      expect(headers.Authorization).toBe(RAW_TOKEN);
      expect(headers.Authorization).not.toContain("Bearer");
    });

    it("auto-injects an Idempotency-Key on a write without the adapter relying on it", async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(200, trainingDayProgram));
      const adapter = createLegacyMobileRestAdapter();

      const program = await adapter.createGeneralProgram(RAW_TOKEN, {
        levelId: 7,
        scheduledDate: "2026-06-22",
        isRestDay: false,
        dailyProgram: trainingDayProgram.dailyProgram,
      });

      const headers = headersOf(lastRequestInit(fetchSpy));

      expect(headers["Idempotency-Key"]).toBeTruthy();

      const sentBody = String(lastRequestInit(fetchSpy).body);

      expect(JSON.parse(sentBody)).toMatchObject({ trainingLevel: { id: 7 } });
      expect(sentBody).not.toContain("trainingLevelId");
      expect(program.id).toBe(100);
      expect(program.trainingLevelId).toBe(7);
    });
  });

  describe("getGeneralProgram", () => {
    it("returns the parsed program on 200 and maps trainingLevel to trainingLevelId", async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(200, trainingDayProgram));
      const adapter = createLegacyMobileRestAdapter();

      const program = await adapter.getGeneralProgram(RAW_TOKEN, 7, "2026-06-22");

      expect(program).toEqual({
        id: 100,
        scheduledDate: "2026-06-22",
        trainingLevelId: 7,
        isRestDay: false,
        dailyProgram: trainingDayProgram.dailyProgram,
      });
    });

    it("returns null when the legacy row is absent (404)", async () => {
      fetchSpy.mockResolvedValueOnce(errorResponse(404));
      const adapter = createLegacyMobileRestAdapter();

      const program = await adapter.getGeneralProgram(RAW_TOKEN, 7, "2026-06-22");

      expect(program).toBeNull();
    });
  });

  describe("createGeneralProgram", () => {
    it("propagates a ConflictError on a legacy 409", async () => {
      fetchSpy.mockResolvedValueOnce(errorResponse(409));
      const adapter = createLegacyMobileRestAdapter();

      await expect(
        adapter.createGeneralProgram(RAW_TOKEN, {
          levelId: 7,
          scheduledDate: "2026-06-22",
          isRestDay: false,
          dailyProgram: null,
        }),
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe("transport failures", () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("maps a network failure to a BadGatewayError", async () => {
      fetchSpy.mockRejectedValue(new TypeError("network down"));
      const adapter = createLegacyMobileRestAdapter();

      await expect(adapter.getTrainingLevels(RAW_TOKEN)).rejects.toBeInstanceOf(BadGatewayError);
    });

    it("surfaces a TimeoutError when the request aborts", async () => {
      const abortError = new Error("aborted");

      abortError.name = "AbortError";
      fetchSpy.mockRejectedValue(abortError);
      const adapter = createLegacyMobileRestAdapter();

      await expect(adapter.getTrainingLevels(RAW_TOKEN)).rejects.toBeInstanceOf(TimeoutError);
    });
  });
});
