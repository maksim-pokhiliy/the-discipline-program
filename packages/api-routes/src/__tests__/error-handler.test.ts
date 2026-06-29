import { afterEach, describe, expect, it, vi } from "vitest";
import { type ZodError, z } from "zod";

import { BadRequestError, InternalServerError, NotFoundError, ValidationError } from "@repo/errors";

import type { MonitoringPort } from "../monitoring";

vi.mock("../monitoring", () => ({
  getMonitoring: vi.fn(() => undefined),
}));

const { getMonitoring } = await import("../monitoring");
const { handleApiError } = await import("../error-handler");

const mockGetMonitoring = vi.mocked(getMonitoring);

const captureSpy = (): ReturnType<typeof vi.fn> => {
  const captureException = vi.fn(() => "event-id");

  mockGetMonitoring.mockReturnValue({ captureException } as unknown as MonitoringPort);

  return captureException;
};

const makeZodError = (): ZodError => {
  const result = z.object({ name: z.string() }).safeParse({ name: 42 });

  if (result.success) {
    throw new Error("expected a ZodError");
  }

  return result.error;
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("handleApiError — Sentry capture gating", () => {
  it("treats a bare ZodError as a server fault — 500 and captured", () => {
    const captureException = captureSpy();

    const response = handleApiError(makeZodError(), "req-1");

    expect(response.status).toBe(500);
    expect(captureException).toHaveBeenCalledOnce();
  });

  it("renders a ValidationError as 400 with top-level issues, not captured", async () => {
    const captureException = captureSpy();
    const issues = [{ path: "contact", message: "Required", code: "invalid_type" }];

    const response = handleApiError(new ValidationError("Validation failed", { issues }), "req-1b");
    const json = (await response.json()) as {
      error: { code: string; issues?: unknown; details?: unknown };
    };

    expect(response.status).toBe(400);
    expect(captureException).not.toHaveBeenCalled();
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.issues).toEqual(issues);
    expect(json.error.details).toBeUndefined();
  });

  it("does not capture 4xx client AppErrors", () => {
    const clientErrors = [
      new BadRequestError("bad"),
      new NotFoundError("missing"),
      new ValidationError("invalid"),
    ];

    for (const error of clientErrors) {
      const captureException = captureSpy();

      handleApiError(error, "req-2");

      expect(captureException).not.toHaveBeenCalled();
    }
  });

  it("captures 5xx AppErrors and returns 500", () => {
    const captureException = captureSpy();

    const response = handleApiError(new InternalServerError("boom"), "req-3");

    expect(response.status).toBe(500);
    expect(captureException).toHaveBeenCalledOnce();
  });

  it("captures unknown errors and returns 500", () => {
    const captureException = captureSpy();

    const response = handleApiError(new Error("unexpected"), "req-4");

    expect(response.status).toBe(500);
    expect(captureException).toHaveBeenCalledOnce();
  });

  it("does not leak details in a 5xx response body", async () => {
    captureSpy();

    const response = handleApiError(
      new InternalServerError("Response validation failed", {
        issues: [{ path: "contact", message: "Required", code: "invalid_type" }],
      }),
      "req-5",
    );
    const json = (await response.json()) as { error: { details?: unknown; issues?: unknown } };

    expect(response.status).toBe(500);
    expect(json.error.details).toBeUndefined();
    expect(json.error.issues).toBeUndefined();
  });
});
