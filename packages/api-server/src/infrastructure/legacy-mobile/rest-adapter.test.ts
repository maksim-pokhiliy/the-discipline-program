import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BadGatewayError, ConflictError, TimeoutError } from "@repo/errors";

import { createLegacyMobileRestAdapter } from "./rest-adapter";

const RAW_TOKEN = "raw-legacy-jwt-token";

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const noContentResponse = (): Response => new Response(null, { status: 204 });

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

const individualDayProgram = {
  id: 200,
  userId: 5,
  scheduledDate: "2026-06-22",
  isRestDay: false,
  dailyProgram: {
    dayTrainings: [
      { trainingNumber: 1, blocks: [{ name: "Strength", exercises: ["Back Squat 5x5"] }] },
    ],
  },
};

const athletesPayload = [
  {
    id: 5,
    username: "athlete@tdp.local",
    firstName: "Test",
    lastName: "Athlete",
    isEnabled: true,
    userRole: { id: 1, name: "USER" },
    userPlan: { id: 2, name: "Individual" },
    phoneNumber: "555-0100",
  },
  {
    id: 6,
    username: "athlete2@tdp.local",
    firstName: null,
    lastName: null,
    userPlan: { id: 2, name: "Individual" },
  },
];

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

const lastRequestUrl = (fetchSpy: ReturnType<typeof vi.spyOn>): string => {
  const call = fetchSpy.mock.calls.at(-1);

  if (!call) {
    throw new Error("fetch was not called");
  }

  return String(call[0]);
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

  describe("getIndividualProgram", () => {
    it("returns the parsed program on 200 mapped to LegacyIndividualProgram", async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(200, individualDayProgram));
      const adapter = createLegacyMobileRestAdapter();

      const program = await adapter.getIndividualProgram(RAW_TOKEN, 5, "2026-06-22");

      expect(program).toEqual({
        id: 200,
        userId: 5,
        scheduledDate: "2026-06-22",
        isRestDay: false,
        dailyProgram: individualDayProgram.dailyProgram,
      });

      const url = lastRequestUrl(fetchSpy);

      expect(url).toContain("/individualProgram");
      expect(url).toContain("userId=5");
      expect(url).toContain("scheduledDate=2026-06-22");
    });

    it("returns null when the individual row is absent (404)", async () => {
      fetchSpy.mockResolvedValueOnce(errorResponse(404));
      const adapter = createLegacyMobileRestAdapter();

      const program = await adapter.getIndividualProgram(RAW_TOKEN, 5, "2026-06-22");

      expect(program).toBeNull();
    });
  });

  describe("createIndividualProgram", () => {
    it("POSTs a flat userId body (not the nested general shape) to /individualProgram", async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(200, individualDayProgram));
      const adapter = createLegacyMobileRestAdapter();

      const program = await adapter.createIndividualProgram(RAW_TOKEN, {
        userId: 5,
        scheduledDate: "2026-06-22",
        isRestDay: false,
        dailyProgram: individualDayProgram.dailyProgram,
      });

      const init = lastRequestInit(fetchSpy);
      const sentBody = String(init.body);

      expect(init.method).toBe("POST");
      expect(lastRequestUrl(fetchSpy)).toContain("/individualProgram");
      expect(JSON.parse(sentBody)).toMatchObject({ userId: 5 });
      expect(sentBody).not.toContain('"user"');
      expect(sentBody).not.toContain("trainingLevel");
      expect(program.id).toBe(200);
      expect(program.userId).toBe(5);
    });

    it("propagates a ConflictError on a legacy 409", async () => {
      fetchSpy.mockResolvedValueOnce(errorResponse(409));
      const adapter = createLegacyMobileRestAdapter();

      await expect(
        adapter.createIndividualProgram(RAW_TOKEN, {
          userId: 5,
          scheduledDate: "2026-06-22",
          isRestDay: false,
          dailyProgram: null,
        }),
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it("does not retry the POST and surfaces a BadGatewayError on a 5xx", async () => {
      fetchSpy.mockResolvedValue(errorResponse(500));
      const adapter = createLegacyMobileRestAdapter();

      await expect(
        adapter.createIndividualProgram(RAW_TOKEN, {
          userId: 5,
          scheduledDate: "2026-06-22",
          isRestDay: false,
          dailyProgram: null,
        }),
      ).rejects.toBeInstanceOf(BadGatewayError);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteIndividualProgram", () => {
    it("DELETEs /individualProgram/{id} and resolves to void", async () => {
      fetchSpy.mockResolvedValueOnce(noContentResponse());
      const adapter = createLegacyMobileRestAdapter();

      await expect(adapter.deleteIndividualProgram(RAW_TOKEN, 777)).resolves.toBeUndefined();

      const init = lastRequestInit(fetchSpy);

      expect(init.method).toBe("DELETE");
      expect(lastRequestUrl(fetchSpy)).toContain("/individualProgram/777");
    });

    it("treats a 404 as idempotent and resolves to void", async () => {
      fetchSpy.mockResolvedValueOnce(errorResponse(404));
      const adapter = createLegacyMobileRestAdapter();

      await expect(adapter.deleteIndividualProgram(RAW_TOKEN, 777)).resolves.toBeUndefined();
    });

    it("does not retry the DELETE and surfaces a BadGatewayError on a 5xx", async () => {
      fetchSpy.mockResolvedValue(errorResponse(500));
      const adapter = createLegacyMobileRestAdapter();

      await expect(adapter.deleteIndividualProgram(RAW_TOKEN, 777)).rejects.toBeInstanceOf(
        BadGatewayError,
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("getIndividualAthletes", () => {
    it("GETs /user with userPlanId=2 and maps id/username/firstName/lastName, tolerating extra and null fields", async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(200, athletesPayload));
      const adapter = createLegacyMobileRestAdapter();

      const athletes = await adapter.getIndividualAthletes(RAW_TOKEN);

      expect(athletes).toEqual([
        { id: 5, username: "athlete@tdp.local", firstName: "Test", lastName: "Athlete" },
        { id: 6, username: "athlete2@tdp.local", firstName: null, lastName: null },
      ]);

      const url = lastRequestUrl(fetchSpy);

      expect(url).toContain("/user");
      expect(url).toContain("userPlanId=2");
    });

    it("surfaces a BadGatewayError when an athlete id is not a number (no coercion)", async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(200, [{ id: "not-a-number", username: "x" }]));
      const adapter = createLegacyMobileRestAdapter();

      await expect(adapter.getIndividualAthletes(RAW_TOKEN)).rejects.toBeInstanceOf(
        BadGatewayError,
      );
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
