export const IDEMPOTENCY_TTL_HOURS = 24;
export const IDEMPOTENCY_TTL_SECONDS = IDEMPOTENCY_TTL_HOURS * 60 * 60;

export const IDEMPOTENCY_HEADER_REQUEST = "Idempotency-Key";
export const IDEMPOTENCY_HEADER_REPLAYED = "Idempotency-Replayed";
export const IDEMPOTENCY_HEADER_CREATED_AT = "Idempotency-Key-Created-At";

export const IDEMPOTENCY_KEY_MAX_LENGTH = 256;
export const IDEMPOTENCY_KEY_MIN_LENGTH = 1;
export const IDEMPOTENCY_KEY_REGEX = /^[A-Za-z0-9_-]{1,256}$/;

export const REPLAYABLE_RESPONSE_HEADERS: ReadonlySet<string> = new Set([
  "content-type",
  "content-encoding",
  "cache-control",
  "x-request-id",
]);
