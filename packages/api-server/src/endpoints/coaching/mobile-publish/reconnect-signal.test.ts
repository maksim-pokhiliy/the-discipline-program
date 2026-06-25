import { describe, expect, it } from "vitest";

import { BadRequestError, UnauthorizedError } from "@repo/errors";

import {
  MOBILE_RECONNECT_REQUIRED,
  reconnectRequiredError,
  tokenUnreadableError,
} from "./reconnect-signal";

describe("reconnectRequiredError", () => {
  it("is a 401 carrying the reconnect reason code (QA-#14/#15)", () => {
    const error = reconnectRequiredError("session expired");

    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.statusCode).toBe(401);
    expect(error.details).toMatchObject({ reason: MOBILE_RECONNECT_REQUIRED });
    expect(error.message).toBe("session expired");
  });
});

describe("tokenUnreadableError", () => {
  it("is a 400 carrying the reconnect reason code (QA-#14)", () => {
    const error = tokenUnreadableError();

    expect(error).toBeInstanceOf(BadRequestError);
    expect(error.statusCode).toBe(400);
    expect(error.details).toMatchObject({ reason: MOBILE_RECONNECT_REQUIRED });
  });
});
