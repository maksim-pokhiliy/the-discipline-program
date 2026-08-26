import { describe, expect, it } from "vitest";
import { z } from "zod";

import vercelConfig from "../../vercel.json";

const APEX_HOST = "thedisciplineprogram.com";
const WWW_ORIGIN = "https://www.thedisciplineprogram.com";
const SHIM_PREFIX = "api/v1";
const SECURITY_HEADER_KEYS = [
  "Strict-Transport-Security",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "X-XSS-Protection",
  "Permissions-Policy",
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

const vercelConfigSchema = z
  .object({
    headers: z.array(headerRuleSchema),
    redirects: z.array(redirectSchema),
    regions: z.array(z.string()),
  })
  .strict();

const config = vercelConfigSchema.parse(vercelConfig);

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

describe("apps/platform vercel.json", () => {
  it("keeps the five security headers on every path", () => {
    const [rule, ...rest] = config.headers;

    expect(rest).toHaveLength(0);
    expect(rule?.source).toBe("/(.*)");
    expect(rule?.headers.map((header) => header.key)).toEqual(SECURITY_HEADER_KEYS);
  });

  it("redirects only when the request arrives on the apex host", () => {
    const [condition] = apexRedirectOf().has;

    expect(condition).toEqual({ type: "host", value: APEX_HOST });
  });

  it("names the apex as a bare hostname, since the platform lowercases it and strips the port", () => {
    const [condition] = apexRedirectOf().has;

    expect(condition?.value).not.toMatch(/[/:]/);
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
