import { describe, expect, it } from "vitest";

import {
  buildAuthScope,
  buildCanonicalRoute,
  buildPublicScope,
  buildRoutePath,
} from "../request-route";

const req = (path: string, headers: Record<string, string> = {}): Request =>
  new Request(`https://example.com${path}`, { headers });

describe("buildRoutePath", () => {
  it("MT-2 / QA-002 — returns segment-aware canonical path that does not collide on substring-prefix dynamic ids", () => {
    const a = buildRoutePath(req("/api/x/abc-123"), { id: "abc-123" });
    const b = buildRoutePath(req("/api/x/abc-123def"), { id: "abc-123def" });

    expect(a).toBe("/api/x/[id]");
    expect(b).toBe("/api/x/[id]");
  });

  it("MT-2 / QA-002 — does NOT rewrite a longer segment when the dynamic value is only a substring of it", () => {
    expect(buildRoutePath(req("/api/x/abc-123def"), { id: "abc-123" })).toBe("/api/x/abc-123def");
  });

  it("MT-3 — replaces every whole-segment occurrence of a dynamic value, not just the first", () => {
    expect(buildRoutePath(req("/api/foo/bar/foo/baz"), { a: "foo" })).toBe("/api/[a]/bar/[a]/baz");
  });

  it("substitutes multiple distinct dynamic segments", () => {
    expect(buildRoutePath(req("/api/team/t-1/user/u-9"), { teamId: "t-1", userId: "u-9" })).toBe(
      "/api/team/[teamId]/user/[userId]",
    );
  });

  it("ignores empty params values so a missing id never replaces the leading slash", () => {
    expect(buildRoutePath(req("/api/admin/blog"), { id: "" })).toBe("/api/admin/blog");
  });

  it("returns the pathname unchanged when params are empty", () => {
    expect(buildRoutePath(req("/api/health"), {})).toBe("/api/health");
  });
});

describe("buildCanonicalRoute", () => {
  it("uppercases the method and prefixes the canonical path", () => {
    expect(buildCanonicalRoute("post", req("/api/admin/blog/abc-123"), { id: "abc-123" })).toBe(
      "POST /api/admin/blog/[id]",
    );
  });

  it("MT-2 — produces the same canonical route for two requests with substring-prefix ids", () => {
    const a = buildCanonicalRoute("POST", req("/api/x/abc-123"), { id: "abc-123" });
    const b = buildCanonicalRoute("POST", req("/api/x/abc-123def"), { id: "abc-123def" });

    expect(a).toBe(b);
    expect(a).toBe("POST /api/x/[id]");
  });
});

describe("buildAuthScope", () => {
  it("prefixes a userId with user:", () => {
    expect(buildAuthScope("user-cuid")).toBe("user:user-cuid");
  });

  it("MT-11 — produces a different scope per userId so cross-tenant cache lookups cannot collide", () => {
    expect(buildAuthScope("A")).not.toBe(buildAuthScope("B"));
  });
});

describe("buildPublicScope", () => {
  it("returns ip:unknown when no forwarding header is present", () => {
    expect(buildPublicScope(req("/api/public/contact"))).toBe("ip:unknown");
  });

  it("uses the leftmost x-forwarded-for value (the originating client)", () => {
    expect(
      buildPublicScope(req("/api/public/contact", { "x-forwarded-for": "10.0.0.1, 1.2.3.4" })),
    ).toBe("ip:10.0.0.1");
  });
});
