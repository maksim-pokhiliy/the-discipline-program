import { describe, expect, it } from "vitest";

import { readCredentialIdentifier } from "../read-credential-identifier";

const formRequest = (body: string): Request =>
  new Request("https://example.com/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

const jsonRequest = (body: unknown): Request =>
  new Request("https://example.com/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("readCredentialIdentifier", () => {
  it("reads and normalizes the email from a form-encoded body", async () => {
    const request = formRequest(
      new URLSearchParams({ email: "  Coach@Example.com ", password: "x" }).toString(),
    );

    expect(await readCredentialIdentifier(request)).toBe("coach@example.com");
  });

  it("reads and normalizes the email from a JSON body", async () => {
    const request = jsonRequest({ email: "Athlete@Example.com", password: "x" });

    expect(await readCredentialIdentifier(request)).toBe("athlete@example.com");
  });

  it("returns null when the body has no email field", async () => {
    const request = formRequest(new URLSearchParams({ password: "x" }).toString());

    expect(await readCredentialIdentifier(request)).toBeNull();
  });

  it("returns null for an empty body", async () => {
    const request = formRequest("");

    expect(await readCredentialIdentifier(request)).toBeNull();
  });

  it("returns null for a malformed JSON body", async () => {
    const request = jsonRequest("{not-json");

    expect(await readCredentialIdentifier(request)).toBeNull();
  });

  it("returns null when the email field is not a string", async () => {
    const request = jsonRequest({ email: 42 });

    expect(await readCredentialIdentifier(request)).toBeNull();
  });

  it("does not consume the request body", async () => {
    const request = formRequest(
      new URLSearchParams({ email: "coach@example.com", password: "x" }).toString(),
    );

    await readCredentialIdentifier(request);

    expect(request.bodyUsed).toBe(false);
    await expect(request.text()).resolves.toContain("email=coach%40example.com");
  });
});
