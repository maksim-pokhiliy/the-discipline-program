import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ServiceUnavailableError } from "@repo/errors";

import { ApiClient } from "../client";

const okJsonResponse = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

const fiveOhThreeResponse = (): Response =>
  new Response(JSON.stringify({ error: { message: "Service Unavailable" } }), {
    status: 503,
    headers: { "content-type": "application/json" },
  });

describe("ApiClient retry budget allows retries within total duration", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    vi.useRealTimers();
  });

  it("retries a 503 response and returns the eventual 200 within the default budget", async () => {
    fetchSpy
      .mockResolvedValueOnce(fiveOhThreeResponse())
      .mockResolvedValueOnce(okJsonResponse({ ok: true }));

    const client = new ApiClient({ baseUrl: "https://example.test" });

    const result = await client.request<{ ok: boolean }>("/probe", "GET");

    expect(result).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("retries up to maxRetries times on persistent 503 then surfaces ServiceUnavailableError", async () => {
    fetchSpy
      .mockResolvedValueOnce(fiveOhThreeResponse())
      .mockResolvedValueOnce(fiveOhThreeResponse())
      .mockResolvedValueOnce(fiveOhThreeResponse());

    const client = new ApiClient({ baseUrl: "https://example.test" });

    await expect(client.request("/probe", "GET")).rejects.toBeInstanceOf(ServiceUnavailableError);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
