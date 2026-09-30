import { createPublicKey, createVerify, type KeyObject } from "node:crypto";

import { BadGatewayError, InternalServerError } from "@repo/errors";

import { UNREADABLE_WEBHOOK_KEY_MESSAGE } from "./monobank-parse";
import { MONOBANK_PATH } from "./monobank-wire";
import type { SignedWebhook } from "./port";

const KEY_REFETCH_MIN_INTERVAL_MS = 60_000;
const MIN_DER_SIGNATURE_BYTES = 8;
const MAX_DER_SIGNATURE_BYTES = 72;
const DER_SEQUENCE_TAG = 0x30;
const DER_HEADER_BYTES = 2;
const BASE64_BLOCK_CHARS = 4;
const STRICT_BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const PEM_HEADER = "-----BEGIN";
const PUBLIC_KEY_PEM_BEGIN = "-----BEGIN PUBLIC KEY-----";
const PUBLIC_KEY_PEM_END = "-----END PUBLIC KEY-----";
const SIGNATURE_ALGORITHM = "SHA256";
const EC_KEY_TYPE = "ec";
const P256_CURVE = "prime256v1";

const MALFORMED_PINNED_KEY_MESSAGE =
  "monobank webhook public key is not a base64-encoded EC public key";

export type WebhookVerifier = {
  verify: (webhook: SignedWebhook) => Promise<boolean>;
};

type WebhookVerifierDeps = {
  pinnedKey: string | undefined;
  fetchKey: () => Promise<string>;
};

type KeyCache = {
  current: () => KeyObject | null;
  load: () => Promise<KeyObject>;
  isRefetchAllowed: () => boolean;
};

type KeyCacheState = {
  key: KeyObject | null;
  lastFetchStartedAt: number | null;
  inFlight: Promise<KeyObject> | null;
};

const toPem = (value: string): string => {
  const trimmed = value.trim();
  const decoded = Buffer.from(trimmed, "base64").toString("utf8");

  if (decoded.includes(PEM_HEADER)) {
    return decoded;
  }

  return `${PUBLIC_KEY_PEM_BEGIN}\n${trimmed}\n${PUBLIC_KEY_PEM_END}\n`;
};

const importPublicKey = (pem: string): KeyObject | null => {
  try {
    return createPublicKey(pem);
  } catch {
    return null;
  }
};

const isP256Key = (key: KeyObject): boolean =>
  key.asymmetricKeyType === EC_KEY_TYPE && key.asymmetricKeyDetails?.namedCurve === P256_CURVE;

const decodePublicKey = (value: string): KeyObject | null => {
  const key = importPublicKey(toPem(value));

  return key !== null && isP256Key(key) ? key : null;
};

const toSignatureBytes = (signature: string): Buffer | null => {
  if (signature.length % BASE64_BLOCK_CHARS !== 0 || !STRICT_BASE64.test(signature)) {
    return null;
  }

  const bytes = Buffer.from(signature, "base64");
  const hasDerLength =
    bytes.length >= MIN_DER_SIGNATURE_BYTES && bytes.length <= MAX_DER_SIGNATURE_BYTES;
  const isDerSequence =
    bytes[0] === DER_SEQUENCE_TAG && bytes[1] === bytes.length - DER_HEADER_BYTES;

  return hasDerLength && isDerSequence ? bytes : null;
};

const check = (key: KeyObject, rawBody: string, bytes: Buffer): boolean =>
  createVerify(SIGNATURE_ALGORITHM).update(rawBody, "utf8").verify(key, bytes);

const fetchAndDecode = async (fetchKey: () => Promise<string>): Promise<KeyObject> => {
  const key = decodePublicKey(await fetchKey());

  if (key === null) {
    throw new BadGatewayError(UNREADABLE_WEBHOOK_KEY_MESSAGE, { path: MONOBANK_PATH.publicKey });
  }

  return key;
};

const createKeyCache = (fetchKey: () => Promise<string>): KeyCache => {
  const state: KeyCacheState = { key: null, lastFetchStartedAt: null, inFlight: null };

  const load = (): Promise<KeyObject> => {
    if (state.inFlight !== null) {
      return state.inFlight;
    }

    state.lastFetchStartedAt = Date.now();
    state.inFlight = fetchAndDecode(fetchKey)
      .then((key) => {
        state.key = key;

        return key;
      })
      .finally(() => {
        state.inFlight = null;
      });

    return state.inFlight;
  };

  const isRefetchAllowed = (): boolean => {
    if (state.inFlight !== null) {
      return true;
    }

    return (
      state.lastFetchStartedAt !== null &&
      Date.now() - state.lastFetchStartedAt >= KEY_REFETCH_MIN_INTERVAL_MS
    );
  };

  return { current: () => state.key, load, isRefetchAllowed };
};

const createPinnedKeyVerifier = (pinnedKey: string): WebhookVerifier => {
  const key = decodePublicKey(pinnedKey);

  if (key === null) {
    throw new InternalServerError(MALFORMED_PINNED_KEY_MESSAGE);
  }

  return {
    verify: async ({ rawBody, signature }) => {
      const bytes = toSignatureBytes(signature);

      return bytes !== null && check(key, rawBody, bytes);
    },
  };
};

const createFetchedKeyVerifier = (fetchKey: () => Promise<string>): WebhookVerifier => {
  const keys = createKeyCache(fetchKey);

  return {
    verify: async ({ rawBody, signature }) => {
      const bytes = toSignatureBytes(signature);

      if (bytes === null) {
        return false;
      }

      if (check(keys.current() ?? (await keys.load()), rawBody, bytes)) {
        return true;
      }

      if (!keys.isRefetchAllowed()) {
        return false;
      }

      return check(await keys.load(), rawBody, bytes);
    },
  };
};

export const createWebhookVerifier = ({
  pinnedKey,
  fetchKey,
}: WebhookVerifierDeps): WebhookVerifier =>
  pinnedKey === undefined ? createFetchedKeyVerifier(fetchKey) : createPinnedKeyVerifier(pinnedKey);
