import {
  IDEMPOTENCY_HEADER_CREATED_AT,
  IDEMPOTENCY_HEADER_REPLAYED,
  REPLAYABLE_RESPONSE_HEADERS,
} from "./constants";
import type { CachedResponse } from "./port";

const NO_CONTENT_STATUS = 204;

const safeJsonParse = (raw: string): { ok: true; value: unknown } | { ok: false } => {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
};

export const cloneResponseForCache = async (response: Response): Promise<CachedResponse | null> => {
  const clone = response.clone();
  const bodyText = clone.status === NO_CONTENT_STATUS ? null : await clone.text();

  let body: unknown = null;

  if (bodyText) {
    const parsed = safeJsonParse(bodyText);

    if (!parsed.ok) {
      return null;
    }

    body = parsed.value;
  }

  const headers: Record<string, string> = {};

  for (const [name, value] of clone.headers.entries()) {
    if (REPLAYABLE_RESPONSE_HEADERS.has(name.toLowerCase())) {
      headers[name] = value;
    }
  }

  return { status: clone.status, body, headers, createdAt: new Date() };
};

export const replayResponse = (cached: CachedResponse): Response => {
  const headers = new Headers(cached.headers);

  headers.set(IDEMPOTENCY_HEADER_REPLAYED, "true");
  headers.set(IDEMPOTENCY_HEADER_CREATED_AT, cached.createdAt.toISOString());

  if (cached.status === NO_CONTENT_STATUS) {
    return new Response(null, { status: NO_CONTENT_STATUS, headers });
  }

  return new Response(JSON.stringify(cached.body), {
    status: cached.status,
    headers: { ...Object.fromEntries(headers.entries()), "content-type": "application/json" },
  });
};

export const annotateLive = (response: Response): Response => {
  response.headers.set(IDEMPOTENCY_HEADER_REPLAYED, "false");

  return response;
};
