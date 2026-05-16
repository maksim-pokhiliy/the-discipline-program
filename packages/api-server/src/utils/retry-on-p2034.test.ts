import { Prisma } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ServiceUnavailableError } from "@repo/errors";

import { retryOnP2034 } from "./retry-on-p2034";

const makeP2034 = (): Prisma.PrismaClientKnownRequestError =>
  new Prisma.PrismaClientKnownRequestError("Serialization failure", {
    code: "P2034",
    clientVersion: "5.0.0",
  });

describe("retryOnP2034", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns result when fn succeeds on first attempt", async () => {
    const fn = vi.fn().mockResolvedValue("ok");

    const result = await retryOnP2034(fn);

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries once on P2034 and returns result on success", async () => {
    const fn = vi.fn().mockRejectedValueOnce(makeP2034()).mockResolvedValue("ok");

    vi.spyOn(Math, "random").mockReturnValue(0);

    const result = await retryOnP2034(fn);

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws ServiceUnavailableError after exhausting retries on P2034", async () => {
    const fn = vi.fn().mockRejectedValue(makeP2034());

    vi.spyOn(Math, "random").mockReturnValue(0);

    await expect(retryOnP2034(fn)).rejects.toThrow(ServiceUnavailableError);
    await expect(retryOnP2034(fn)).rejects.toMatchObject({
      statusCode: 503,
      details: { retryAfter: 5, lastErrorCode: "P2034" },
    });
    expect(fn).toHaveBeenCalled();
  });

  it("rethrows non-P2034 errors immediately without retry", async () => {
    const otherError = new Error("Random failure");
    const fn = vi.fn().mockRejectedValue(otherError);

    await expect(retryOnP2034(fn)).rejects.toBe(otherError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("rethrows non-P2034 Prisma errors immediately", async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError("Unique constraint", {
      code: "P2002",
      clientVersion: "5.0.0",
    });
    const fn = vi.fn().mockRejectedValue(p2002);

    await expect(retryOnP2034(fn)).rejects.toBe(p2002);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("honors custom attempts option", async () => {
    const fn = vi.fn().mockRejectedValue(makeP2034());

    vi.spyOn(Math, "random").mockReturnValue(0);

    await expect(retryOnP2034(fn, { attempts: 3 })).rejects.toThrow(ServiceUnavailableError);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws synchronously when attempts < 1", async () => {
    const fn = vi.fn();

    await expect(retryOnP2034(fn, { attempts: 0 })).rejects.toThrow(/attempts must be >= 1/);
    expect(fn).not.toHaveBeenCalled();
  });

  it("uses ServiceUnavailableError with custom retryAfterSeconds", async () => {
    const fn = vi.fn().mockRejectedValue(makeP2034());

    vi.spyOn(Math, "random").mockReturnValue(0);

    await expect(retryOnP2034(fn, { retryAfterSeconds: 30 })).rejects.toMatchObject({
      details: { retryAfter: 30 },
    });
  });
});
