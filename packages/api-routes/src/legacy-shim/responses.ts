import type { LegacyShimOutcome } from "./types";

const LEGACY_DENIED_STATUS = 403;

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
