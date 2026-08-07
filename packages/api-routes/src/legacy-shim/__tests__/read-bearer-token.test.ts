import { describe, expect, it } from "vitest";

import { readLegacyBearerToken } from "../read-bearer-token";

const requestWith = (headers: Record<string, string>): Request =>
  new Request("http://localhost/api/v1/user", { headers });

describe("readLegacyBearerToken", () => {
  it("accepts the raw token, which is what the iOS app actually sends", () => {
    expect(readLegacyBearerToken(requestWith({ authorization: "abc.def.ghi" }))).toBe(
      "abc.def.ghi",
    );
  });

  it("accepts a Bearer-prefixed token even though legacy rejects it", () => {
    expect(readLegacyBearerToken(requestWith({ authorization: "Bearer abc.def.ghi" }))).toBe(
      "abc.def.ghi",
    );
  });

  it("accepts a Bearer prefix with no space, which legacy also accepts", () => {
    expect(readLegacyBearerToken(requestWith({ authorization: "Bearerabc.def.ghi" }))).toBe(
      "abc.def.ghi",
    );
  });

  it("returns null when the header is absent", () => {
    expect(readLegacyBearerToken(requestWith({}))).toBeNull();
  });

  it("returns null when the header is blank", () => {
    expect(readLegacyBearerToken(requestWith({ authorization: "   " }))).toBeNull();
  });

  it("strips only the leading prefix, leaving an embedded occurrence intact", () => {
    expect(readLegacyBearerToken(requestWith({ authorization: "abcBearerdef" }))).toBe(
      "abcBearerdef",
    );
  });
});
