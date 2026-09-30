import { generateKeyPairSync, type KeyObject } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BadGatewayError, InternalServerError } from "@repo/errors";

import {
  captureAppError,
  generateSigningKey,
  jsonResponse,
  makeAdapterConfig,
  OK_STATUS,
  PUBLIC_KEY_PATH,
  publicKeyValueOf,
  readTestPublicKeyValue,
  readWebhookCapture,
  requestOf,
  signBody,
  TEST_API_URL,
  TEST_MERCHANT_TOKEN,
  UNAUTHORIZED_STATUS,
} from "./__fixtures__/monobank-fixtures";
import { createMonobankAdapter } from "./monobank-adapter";
import type { PaymentPort, SignedWebhook } from "./port";

const KEY_REFETCH_MIN_INTERVAL_MS = 60_000;
const RSA_MODULUS_BITS = 2_048;
const OVERSIZED_SIGNATURE_BYTES = 100;
const DER_SIZED_SIGNATURE_BYTES = 70;
const OVERSIZED_DER_SIGNATURE_BYTES = 73;
const DER_HEADER_BYTES = 2;
const NOT_A_DER_SEQUENCE_BYTE = 0x01;
const WRONG_DER_LENGTH_BYTE = 0x01;
const DER_SEQUENCE_TAG = 0x30;
const DER_INTEGER_TAG = 0x02;
const SEVEN_BYTE_DER_SIGNATURE = "MAUCAQECAA==";
const P384_CURVE = "secp384r1";
const SECP256K1_CURVE = "secp256k1";
const MALFORMED_PINNED_KEY_MESSAGE =
  "monobank webhook public key is not a base64-encoded EC public key";
const UNAUTHORIZED_BODY = { errCode: "UNAUTHORIZED", errText: "invalid token" };
const DESTINATION = "Storefront billing spike";
const DESTINATION_WITH_ONE_BYTE_CHANGED = "Storefront billing spikf";
const CYRILLIC_DESTINATION = "Програма «Дисципліна», 4 тижні";
const NOT_BASE64_OF_ALIGNED_LENGTH = "not-base64!!";
const JUNK_INSERT_AT = 8;
const GENUINE_DER_SIGNATURE_BYTES = [69, 70, 71, 72];
const MAX_SIGNING_ATTEMPTS = 20_000;

const created = readWebhookCapture("created");
const processing = readWebhookCapture("processing");
const success = readWebhookCapture("success");
const testKey = readTestPublicKeyValue();
const forgedSuccess: SignedWebhook = { rawBody: success.rawBody, signature: created.signature };

const rsaPublicKeyValue = (): string =>
  publicKeyValueOf(generateKeyPairSync("rsa", { modulusLength: RSA_MODULUS_BITS }).publicKey);

const ecPublicKeyValue = (namedCurve: string): string =>
  publicKeyValueOf(generateKeyPairSync("ec", { namedCurve }).publicKey);

const derShapedSignature = (tag: number, lengthByte: number, totalBytes: number): string =>
  Buffer.concat([
    Buffer.from([tag, lengthByte]),
    Buffer.alloc(totalBytes - DER_HEADER_BYTES, DER_INTEGER_TAG),
  ]).toString("base64");

const bareKeyBody = (value: string): string =>
  Buffer.from(value, "base64")
    .toString("utf8")
    .split("\n")
    .filter((line) => line !== "" && !line.startsWith("-----"))
    .join("");

const toBase64Url = (signature: string): string =>
  signature.replaceAll("+", "-").replaceAll("/", "_");

const withInsertedJunk = (signature: string, junk: string): string =>
  `${signature.slice(0, JUNK_INSERT_AT)}${junk}${signature.slice(JUNK_INSERT_AT)}`;

const signatureOfByteLength = (privateKey: KeyObject, rawBody: string, bytes: number): string => {
  for (let attempt = 0; attempt < MAX_SIGNING_ATTEMPTS; attempt++) {
    const signature = signBody(privateKey, rawBody);

    if (Buffer.from(signature, "base64").length === bytes) {
      return signature;
    }
  }

  throw new Error(`no ${bytes}-byte signature in ${MAX_SIGNING_ATTEMPTS} attempts`);
};

const keyReply = async (): Promise<Response> => jsonResponse(OK_STATUS, { key: testKey });

describe("createMonobankAdapter webhook verification", () => {
  const fetchMock = vi.fn<typeof fetch>();

  const pinnedAdapter = (webhookPublicKey: string = testKey): PaymentPort =>
    createMonobankAdapter(makeAdapterConfig({ fetch: fetchMock, webhookPublicKey }));

  const fetchedKeyAdapter = (): PaymentPort =>
    createMonobankAdapter(makeAdapterConfig({ fetch: fetchMock, webhookPublicKey: undefined }));

  beforeEach(() => {
    fetchMock.mockReset();
  });

  describe("with a pinned key", () => {
    it("verifies the success capture and fetches nothing", async () => {
      await expect(pinnedAdapter().verifyWebhook(success)).resolves.toBe(true);

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([
      ["created", created],
      ["processing", processing],
    ])("verifies the %s capture", async (_name, capture) => {
      await expect(pinnedAdapter().verifyWebhook(capture)).resolves.toBe(true);
    });

    it("refuses the success capture with one byte of the raw body changed", async () => {
      const rawBody = success.rawBody.replace(DESTINATION, DESTINATION_WITH_ONE_BYTE_CHANGED);

      expect(rawBody).not.toBe(success.rawBody);
      expect(rawBody).toHaveLength(success.rawBody.length);
      expect(() => JSON.parse(rawBody)).not.toThrow();

      await expect(
        pinnedAdapter().verifyWebhook({ rawBody, signature: success.signature }),
      ).resolves.toBe(false);
    });

    it("refuses a re-serialized success body (the created body cannot show this: its re-serialization is byte-identical to its raw body)", async () => {
      const rawBody = JSON.stringify(JSON.parse(success.rawBody));

      expect(JSON.stringify(JSON.parse(created.rawBody))).toBe(created.rawBody);
      expect(rawBody).not.toBe(success.rawBody);

      await expect(
        pinnedAdapter().verifyWebhook({ rawBody, signature: success.signature }),
      ).resolves.toBe(false);
    });

    it("verifies the success capture with a pinned key given as a bare base64 body", async () => {
      await expect(pinnedAdapter(bareKeyBody(testKey)).verifyWebhook(success)).resolves.toBe(true);
    });

    it.each([
      ["a value that is not a key", Buffer.from("not-a-key", "utf8").toString("base64")],
      [
        "a PEM with a broken body",
        Buffer.from("-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----\n").toString(
          "base64",
        ),
      ],
    ])("throws InternalServerError at construction for %s", (_label, webhookPublicKey) => {
      expect(() => pinnedAdapter(webhookPublicKey)).toThrow(InternalServerError);
      expect(() => pinnedAdapter(webhookPublicKey)).toThrow(MALFORMED_PINNED_KEY_MESSAGE);
    });

    it("throws InternalServerError at construction for a pinned RSA key", () => {
      const rsaKey = rsaPublicKeyValue();

      expect(() => pinnedAdapter(rsaKey)).toThrow(InternalServerError);
    });

    it.each([
      ["P-384", P384_CURVE],
      ["secp256k1", SECP256K1_CURVE],
    ])("throws InternalServerError at construction for a pinned %s key", (_label, namedCurve) => {
      const curveKey = ecPublicKeyValue(namedCurve);

      expect(() => pinnedAdapter(curveKey)).toThrow(InternalServerError);
      expect(() => pinnedAdapter(curveKey)).toThrow(MALFORMED_PINNED_KEY_MESSAGE);
    });

    it.each(GENUINE_DER_SIGNATURE_BYTES)("verifies a genuine %i-byte signature", async (bytes) => {
      const signingKey = generateSigningKey();
      const signature = signatureOfByteLength(signingKey.privateKey, success.rawBody, bytes);

      expect(Buffer.from(signature, "base64")).toHaveLength(bytes);

      await expect(
        pinnedAdapter(publicKeyValueOf(signingKey.publicKey)).verifyWebhook({
          rawBody: success.rawBody,
          signature,
        }),
      ).resolves.toBe(true);
    });

    it("verifies a body with Cyrillic text signed over its UTF-8 bytes", async () => {
      const signingKey = generateSigningKey();
      const rawBody = success.rawBody.replace(DESTINATION, CYRILLIC_DESTINATION);

      expect(rawBody).toContain(CYRILLIC_DESTINATION);
      expect(Buffer.from(rawBody, "utf8").equals(Buffer.from(rawBody, "latin1"))).toBe(false);

      await expect(
        pinnedAdapter(publicKeyValueOf(signingKey.publicKey)).verifyWebhook({
          rawBody,
          signature: signBody(signingKey.privateKey, rawBody),
        }),
      ).resolves.toBe(true);
    });
  });

  describe("with a fetched key", () => {
    it("fetches the key once for two verifications of the success capture", async () => {
      fetchMock.mockImplementation(keyReply);

      const adapter = fetchedKeyAdapter();

      await expect(adapter.verifyWebhook(success)).resolves.toBe(true);
      await expect(adapter.verifyWebhook(success)).resolves.toBe(true);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("shares one fetch between two concurrent verifications on a cold adapter", async () => {
      fetchMock.mockImplementation(keyReply);

      const adapter = fetchedKeyAdapter();

      await expect(
        Promise.all([adapter.verifyWebhook(success), adapter.verifyWebhook(success)]),
      ).resolves.toEqual([true, true]);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.each([
      ["an empty value", ""],
      ["a value that is not base64", NOT_BASE64_OF_ALIGNED_LENGTH],
      ["the success signature with four ! inserted", withInsertedJunk(success.signature, "!!!!")],
      [
        "the success signature with four spaces inserted",
        withInsertedJunk(success.signature, "    "),
      ],
      ["the base64url form of the success signature", toBase64Url(success.signature)],
      ["a length that is not a multiple of four", success.signature.slice(0, -1)],
      [
        "a 100-byte value",
        Buffer.alloc(OVERSIZED_SIGNATURE_BYTES, DER_SEQUENCE_TAG).toString("base64"),
      ],
      [
        "a 70-byte value that is not a DER sequence",
        Buffer.alloc(DER_SIZED_SIGNATURE_BYTES, NOT_A_DER_SEQUENCE_BYTE).toString("base64"),
      ],
      ["a 7-byte DER sequence", SEVEN_BYTE_DER_SIGNATURE],
      [
        "a 73-byte DER sequence",
        derShapedSignature(
          DER_SEQUENCE_TAG,
          OVERSIZED_DER_SIGNATURE_BYTES - DER_HEADER_BYTES,
          OVERSIZED_DER_SIGNATURE_BYTES,
        ),
      ],
      [
        "a 70-byte value with the right length byte and a tag that is not a sequence",
        derShapedSignature(
          NOT_A_DER_SEQUENCE_BYTE,
          DER_SIZED_SIGNATURE_BYTES - DER_HEADER_BYTES,
          DER_SIZED_SIGNATURE_BYTES,
        ),
      ],
      [
        "a 70-byte DER sequence with a wrong length byte",
        derShapedSignature(DER_SEQUENCE_TAG, WRONG_DER_LENGTH_BYTE, DER_SIZED_SIGNATURE_BYTES),
      ],
    ])("answers false without fetching for %s as the signature", async (_label, signature) => {
      fetchMock.mockImplementation(keyReply);

      await expect(
        fetchedKeyAdapter().verifyWebhook({ rawBody: success.rawBody, signature }),
      ).resolves.toBe(false);

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("fetches the key with GET /api/merchant/pubkey and the X-Token", async () => {
      fetchMock.mockImplementation(keyReply);

      await expect(fetchedKeyAdapter().verifyWebhook(success)).resolves.toBe(true);

      const request = requestOf(fetchMock, 0);

      expect(request.url).toBe(`${TEST_API_URL}${PUBLIC_KEY_PATH}`);
      expect(request.init.method).toBe("GET");
      expect(request.headers).toEqual({ "X-Token": TEST_MERCHANT_TOKEN });
      expect(request.body).toBeUndefined();
    });

    it("treats an empty pinned key as unset and fetches the key", async () => {
      fetchMock.mockImplementation(keyReply);

      await expect(pinnedAdapter("").verifyWebhook(success)).resolves.toBe(true);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("fetches again after a failed cold fetch and then verifies the success capture", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(UNAUTHORIZED_STATUS, UNAUTHORIZED_BODY))
        .mockImplementation(keyReply);

      const adapter = fetchedKeyAdapter();

      expect(await captureAppError(adapter.verifyWebhook(success))).toBeInstanceOf(
        InternalServerError,
      );
      await expect(adapter.verifyWebhook(success)).resolves.toBe(true);

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("throws BadGatewayError when the fetched value is not an EC public key", async () => {
      const rsaKey = rsaPublicKeyValue();

      fetchMock.mockImplementation(async () => jsonResponse(OK_STATUS, { key: rsaKey }));

      const error = await captureAppError(fetchedKeyAdapter().verifyWebhook(success));

      expect(error).toBeInstanceOf(BadGatewayError);
      expect(error.message).toBe("monobank sent a webhook key we cannot read");
      expect(error.details).toEqual({ path: PUBLIC_KEY_PATH });
    });
  });

  describe("with a fetched key on a moving clock", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("throws BadGatewayError, not false, when the key cannot be fetched", async () => {
      fetchMock.mockRejectedValue(new TypeError("fetch failed"));

      const captured = captureAppError(fetchedKeyAdapter().verifyWebhook(success));

      await vi.runAllTimersAsync();

      const error = await captured;

      expect(error).toBeInstanceOf(BadGatewayError);
      expect(error.details).toEqual({ path: PUBLIC_KEY_PATH });
    });

    it("refetches exactly once on a failed verification when the key is older than a minute, then answers false", async () => {
      fetchMock.mockImplementation(keyReply);

      const adapter = fetchedKeyAdapter();

      await expect(adapter.verifyWebhook(success)).resolves.toBe(true);

      vi.advanceTimersByTime(KEY_REFETCH_MIN_INTERVAL_MS + 1);

      await expect(adapter.verifyWebhook(forgedSuccess)).resolves.toBe(false);

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("does not refetch within a minute of the last fetch", async () => {
      fetchMock.mockImplementation(keyReply);

      const adapter = fetchedKeyAdapter();

      await expect(adapter.verifyWebhook(success)).resolves.toBe(true);

      vi.advanceTimersByTime(KEY_REFETCH_MIN_INTERVAL_MS - 1);

      await expect(adapter.verifyWebhook(forgedSuccess)).resolves.toBe(false);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("verifies the success capture after a rotation with exactly one refetch", async () => {
      const rotatedAway = generateSigningKey();
      const signedWithRotatedAwayKey: SignedWebhook = {
        rawBody: success.rawBody,
        signature: signBody(rotatedAway.privateKey, success.rawBody),
      };

      fetchMock
        .mockResolvedValueOnce(
          jsonResponse(OK_STATUS, { key: publicKeyValueOf(rotatedAway.publicKey) }),
        )
        .mockImplementation(keyReply);

      const adapter = fetchedKeyAdapter();

      await expect(adapter.verifyWebhook(signedWithRotatedAwayKey)).resolves.toBe(true);

      vi.advanceTimersByTime(KEY_REFETCH_MIN_INTERVAL_MS + 1);

      await expect(adapter.verifyWebhook(success)).resolves.toBe(true);

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("lets a failing verification join the refetch in flight, so both verify with one refetch", async () => {
      const rotatedAway = generateSigningKey();
      let releaseRefetch: () => void = () => undefined;

      fetchMock
        .mockResolvedValueOnce(
          jsonResponse(OK_STATUS, { key: publicKeyValueOf(rotatedAway.publicKey) }),
        )
        .mockImplementationOnce(
          () =>
            new Promise<Response>((resolve) => {
              releaseRefetch = () => resolve(jsonResponse(OK_STATUS, { key: testKey }));
            }),
        );

      const adapter = fetchedKeyAdapter();

      await expect(
        adapter.verifyWebhook({
          rawBody: success.rawBody,
          signature: signBody(rotatedAway.privateKey, success.rawBody),
        }),
      ).resolves.toBe(true);

      vi.advanceTimersByTime(KEY_REFETCH_MIN_INTERVAL_MS + 1);

      const verifications = Promise.all([
        adapter.verifyWebhook(success),
        adapter.verifyWebhook(success),
      ]);

      releaseRefetch();

      await expect(verifications).resolves.toEqual([true, true]);

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("keeps a good cached key when a refetch fails", async () => {
      fetchMock
        .mockImplementationOnce(keyReply)
        .mockResolvedValueOnce(jsonResponse(UNAUTHORIZED_STATUS, UNAUTHORIZED_BODY))
        .mockImplementation(keyReply);

      const adapter = fetchedKeyAdapter();

      await expect(adapter.verifyWebhook(success)).resolves.toBe(true);

      vi.advanceTimersByTime(KEY_REFETCH_MIN_INTERVAL_MS + 1);

      expect(await captureAppError(adapter.verifyWebhook(forgedSuccess))).toBeInstanceOf(
        InternalServerError,
      );
      await expect(adapter.verifyWebhook(success)).resolves.toBe(true);

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
