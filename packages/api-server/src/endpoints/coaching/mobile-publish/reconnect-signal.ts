import { BadRequestError, UnauthorizedError } from "@repo/errors";

export const MOBILE_RECONNECT_REQUIRED = "MOBILE_RECONNECT_REQUIRED";

export const reconnectRequiredError = (message: string): UnauthorizedError =>
  new UnauthorizedError(message, { reason: MOBILE_RECONNECT_REQUIRED });

export const tokenUnreadableError = (): BadRequestError =>
  new BadRequestError("Stored mobile credential is unreadable — please reconnect", {
    reason: MOBILE_RECONNECT_REQUIRED,
  });
