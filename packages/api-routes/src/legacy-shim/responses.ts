import type { LegacyProgramOutcome, LegacyShimOutcome, LegacyUserOutcome } from "./types";

const LEGACY_DENIED_STATUS = 403;
const LEGACY_OK_EMPTY_STATUS = 200;
const LEGACY_BAD_REQUEST_STATUS = 400;
const LEGACY_UNAUTHORIZED_STATUS = 401;
const LEGACY_NOT_FOUND_STATUS = 404;

export const legacyShimOk = (payload: unknown): Response =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

export const legacyShimDenied = (): Response =>
  new Response(null, { status: LEGACY_DENIED_STATUS });

export const renderLegacyShimOutcome = <TPayload>(
  outcome: LegacyShimOutcome<TPayload>,
): Response => (outcome.kind === "ok" ? legacyShimOk(outcome.payload) : legacyShimDenied());

export const legacyShimOkEmpty = (): Response =>
  new Response(null, { status: LEGACY_OK_EMPTY_STATUS });

export const legacyShimBadRequest = (): Response =>
  new Response(null, { status: LEGACY_BAD_REQUEST_STATUS });

export const legacyShimUnauthorized = (): Response =>
  new Response(null, { status: LEGACY_UNAUTHORIZED_STATUS });

export const legacyShimNotFound = (): Response =>
  new Response(null, { status: LEGACY_NOT_FOUND_STATUS });

export const renderLegacyUserOutcome = <TPayload>(
  outcome: LegacyUserOutcome<TPayload>,
): Response => {
  switch (outcome.kind) {
    case "ok-json":
      return legacyShimOk(outcome.payload);
    case "ok-empty":
      return legacyShimOkEmpty();
    case "not-found":
      return legacyShimNotFound();
    case "unauthorized":
      return legacyShimUnauthorized();
    case "bad-request":
      return legacyShimBadRequest();
  }
};

export const renderLegacyProgramOutcome = <TPayload>(
  outcome: LegacyProgramOutcome<TPayload>,
): Response => {
  switch (outcome.kind) {
    case "ok-json":
      return legacyShimOk(outcome.payload);
    case "not-found":
      return legacyShimNotFound();
  }
};
