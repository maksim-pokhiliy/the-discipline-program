import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { describe, expect, it } from "vitest";
import { z } from "zod";

const APEX_HOST_PATTERN = "^thedisciplineprogram\\.com$";
const APEX_HOST = "thedisciplineprogram.com";
const WWW_ORIGIN = "https://www.thedisciplineprogram.com";
const SHIM_PREFIX = "api/v1";
const APPS = ["admin", "marketing", "platform"];
const PER_APP_KEYS = ["crons", "redirects"];

const SECURITY_HEADERS = [
  ["Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload"],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["X-XSS-Protection", "0"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()"],
];

const hostConditionSchema = z.object({ type: z.literal("host"), value: z.string() }).strict();

const redirectSchema = z
  .object({
    source: z.string(),
    has: z.array(hostConditionSchema).length(1),
    destination: z.string(),
    permanent: z.boolean(),
  })
  .strict();

const headerRuleSchema = z
  .object({
    source: z.string(),
    headers: z.array(z.object({ key: z.string(), value: z.string() }).strict()),
  })
  .strict();

const sharedConfigSchema = z.object({
  headers: z.array(headerRuleSchema),
  regions: z.array(z.string()),
});

const platformConfigSchema = sharedConfigSchema
  .extend({ redirects: z.array(redirectSchema) })
  .strict();

const repoRoot = (): string => {
  let candidate = process.cwd();

  while (!existsSync(join(candidate, "apps/platform/vercel.json"))) {
    const parent = dirname(candidate);

    if (parent === candidate) {
      throw new Error(
        "this test compares the three per-app vercel.json files and could not find the repository " +
          "root above the working directory; run it through the root vitest runner",
      );
    }

    candidate = parent;
  }

  return candidate;
};

const rawConfigOf = (app: string): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(
    readFileSync(join(repoRoot(), "apps", app, "vercel.json"), "utf8"),
  );

  return z.record(z.unknown()).parse(parsed);
};

const sharedBlockOf = (app: string): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(rawConfigOf(app)).filter(([key]) => !PER_APP_KEYS.includes(key)),
  );

const config = platformConfigSchema.parse(rawConfigOf("platform"));

const PARAM_SOURCE_PATTERN = /^\/:path\((.*)\)$/;

const apexRedirectOf = (): z.infer<typeof redirectSchema> => {
  const [apex, ...rest] = config.redirects;

  if (apex === undefined || rest.length > 0) {
    throw new Error(
      `expected exactly one redirect rule, found ${String(config.redirects.length)}. Every rule ` +
        "on this project answers requests on the apex; a second one needs its own test.",
    );
  }

  return apex;
};

const exclusionRegexOf = (source: string): RegExp => {
  const match = PARAM_SOURCE_PATTERN.exec(source);
  const inner = match?.[1];

  if (inner === undefined) {
    throw new Error(
      `the redirect source ${source} is no longer of the form /:path(<pattern>), so the pattern ` +
        "that excludes the shim cannot be lifted out and checked.",
    );
  }

  return new RegExp(`^${inner}$`);
};

const captureOf = (path: string): string => path.slice(1);

describe("the three vercel.json files", () => {
  it("carry byte-identical shared configuration once the per-app keys are removed", () => {
    const [reference, ...others] = APPS.map(sharedBlockOf);

    for (const other of others) {
      expect(other).toEqual(reference);
    }
  });

  it("keep the per-app keys where they belong and nowhere else", () => {
    expect(Object.keys(rawConfigOf("admin"))).toContain("crons");
    expect(Object.keys(rawConfigOf("platform"))).toContain("redirects");
    expect(Object.keys(rawConfigOf("marketing"))).toEqual(["headers", "regions"]);
    expect(Object.keys(rawConfigOf("admin"))).not.toContain("redirects");
    expect(Object.keys(rawConfigOf("platform"))).not.toContain("crons");
  });

  it.each(APPS)("serves the five security headers on every path of %s", (app) => {
    const parsed = sharedConfigSchema.parse(rawConfigOf(app));
    const [rule, ...rest] = parsed.headers;

    expect(rest).toHaveLength(0);
    expect(rule?.source).toBe("/(.*)");
    expect(rule?.headers.map((header) => [header.key, header.value])).toEqual(SECURITY_HEADERS);
  });
});

describe("the platform apex redirect", () => {
  it("matches the apex and nothing under it, anchored and escaped", () => {
    const [condition] = apexRedirectOf().has;

    expect(condition).toEqual({ type: "host", value: APEX_HOST_PATTERN });
  });

  it.each([
    [APEX_HOST, true],
    [`${APEX_HOST}:443`, true],
    [`platform.${APEX_HOST}`, false],
    [`www.${APEX_HOST}`, false],
    ["thedisciplineprogramXcom", false],
    [`evil-${APEX_HOST}`, false],
  ])("is correct for %s whether or not the edge anchors the value", (host, isMatch) => {
    const [condition] = apexRedirectOf().has;
    const value = condition?.value ?? "";
    const withoutPort = host.split(":", 1)[0] ?? "";

    expect(new RegExp(value).test(withoutPort)).toBe(isMatch);
    expect(new RegExp(`^${value}$`).test(withoutPort)).toBe(isMatch);
  });

  it("sends the matched path to the same path on www, permanently", () => {
    const redirect = apexRedirectOf();

    expect(redirect.destination).toBe(`${WWW_ORIGIN}/:path*`);
    expect(redirect.permanent).toBe(true);
  });

  it("still names the shim prefix it exists to exclude", () => {
    expect(apexRedirectOf().source).toContain(SHIM_PREFIX);
  });

  describe("the exclusion pattern lifted out of the redirect source", () => {
    const exclusion = exclusionRegexOf(apexRedirectOf().source);

    it.each(["/api/v1", "/api/v1/", "/api/v1/auth/signin", "/api/v1/program"])(
      "leaves %s on the platform",
      (path) => {
        expect(exclusion.test(captureOf(path))).toBe(false);
      },
    );

    it.each(["/", "/login", "/api/v2/x", "/api/v1x", "/coach/plans"])("sends %s to www", (path) => {
      expect(exclusion.test(captureOf(path))).toBe(true);
    });
  });
});
