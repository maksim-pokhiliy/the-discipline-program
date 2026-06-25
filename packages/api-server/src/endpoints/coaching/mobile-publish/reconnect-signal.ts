import { MOBILE_RECONNECT_REQUIRED } from "@repo/contracts/coaching/mobile-publish";
import { BadRequestError, UnauthorizedError } from "@repo/errors";

export { MOBILE_RECONNECT_REQUIRED };

export const reconnectRequiredError = (message: string): UnauthorizedError =>
  new UnauthorizedError(message, { reason: MOBILE_RECONNECT_REQUIRED });

export const tokenUnreadableError = (): BadRequestError =>
  new BadRequestError("Stored mobile credential is unreadable — please reconnect", {
    reason: MOBILE_RECONNECT_REQUIRED,
  });
