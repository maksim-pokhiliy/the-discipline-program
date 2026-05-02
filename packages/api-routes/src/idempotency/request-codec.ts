import { BadRequestError } from "@repo/errors";

import { IDEMPOTENCY_KEY_MAX_LENGTH, IDEMPOTENCY_KEY_REGEX } from "./constants";
import { fingerprintFormData, fingerprintRawBody, sha256Hex } from "./request-fingerprint";

export type IdempotencyBodyMode = "json" | "formdata" | "none";

export const validateKey = (raw: string | null): string | null => {
  if (!raw) {
    return null;
  }

  const first = raw.split(",", 1)[0]?.trim() ?? "";

  if (!first) {
    return null;
  }

  if (first.length > IDEMPOTENCY_KEY_MAX_LENGTH || !IDEMPOTENCY_KEY_REGEX.test(first)) {
    throw new BadRequestError("Idempotency-Key header malformed", {
      length: first.length,
      keyHash: sha256Hex(first).slice(0, 12),
    });
  }

  return first;
};

const buildFingerprintInput = (request: Request, bodyTag: string): string => {
  const { pathname, search } = new URL(request.url);

  return `path:${pathname}${search}\nbody:${bodyTag}`;
};

export type CapturedBody = { rebuiltRequest: Request; fingerprint: string };

const captureNoneBody = (request: Request): CapturedBody => ({
  rebuiltRequest: request,
  fingerprint: sha256Hex(buildFingerprintInput(request, "")),
});

const captureFormDataBody = async (request: Request): Promise<CapturedBody> => {
  const form = await request.formData();
  const formTag = await fingerprintFormData(form);
  const fingerprint = sha256Hex(buildFingerprintInput(request, formTag));
  const headers = new Headers(request.headers);

  headers.delete("content-type");
  headers.delete("content-length");

  const rebuiltRequest = new Request(request.url, {
    method: request.method,
    headers,
    body: form,
  });

  return { rebuiltRequest, fingerprint };
};

const captureJsonBody = async (request: Request): Promise<CapturedBody> => {
  const text = await request.text();
  const bodyTag = fingerprintRawBody(text);
  const fingerprint = sha256Hex(buildFingerprintInput(request, bodyTag));
  const rebuiltRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: text,
  });

  return { rebuiltRequest, fingerprint };
};

export const captureBody = async (
  request: Request,
  mode: IdempotencyBodyMode,
): Promise<CapturedBody> => {
  if (mode === "none") {
    return captureNoneBody(request);
  }

  if (mode === "formdata") {
    return captureFormDataBody(request);
  }

  return captureJsonBody(request);
};

export const redactScope = (scope: string): string => {
  const colonIdx = scope.indexOf(":");

  if (colonIdx === -1) {
    return scope;
  }

  const kind = scope.slice(0, colonIdx);
  const value = scope.slice(colonIdx + 1);

  if (kind === "user" && value) {
    return `user:${sha256Hex(value).slice(0, 12)}`;
  }

  return scope;
};
