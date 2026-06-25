import { describe, expect, it } from "vitest";

import { BadGatewayError, ServiceUnavailableError } from "@repo/errors";

import { parseErrorResponse } from "../client-error-mapping";

const errorResponse = (status: number, message: string): Response =>
  new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("parseErrorResponse status mapping", () => {
  it("maps a 502 response to BadGatewayError", async () => {
    const error = await parseErrorResponse(
      errorResponse(502, "Bad Gateway"),
      "https://example.test/x",
    );

    expect(error).toBeInstanceOf(BadGatewayError);
    expect(error.statusCode).toBe(502);
    expect(error.code).toBe("BAD_GATEWAY");
  });

  it("maps a 503 response to ServiceUnavailableError", async () => {
    const error = await parseErrorResponse(
      errorResponse(503, "Service Unavailable"),
      "https://example.test/x",
    );

    expect(error).toBeInstanceOf(ServiceUnavailableError);
    expect(error.statusCode).toBe(503);
  });
});
