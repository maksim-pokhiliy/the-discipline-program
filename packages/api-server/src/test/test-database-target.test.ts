import { describe, expect, it } from "vitest";

import { assertTestDatabaseTarget, isTestDatabaseTarget } from "./test-database-target";

const ACCEPTED_TARGETS = [
  ["the local stack's test database", "postgres://postgres:postgres@localhost:5432/tdp_test"],
  ["CI's test database", "postgres://postgres:postgres@localhost:5432/test"],
  ["a throwaway server on its own port", "postgresql://postgres:postgres@localhost:5544/tdp_test"],
  ["an IPv4 loopback host", "postgres://postgres:postgres@127.0.0.1:5432/tdp_test"],
  ["an IPv6 loopback host", "postgres://postgres:postgres@[::1]:5432/tdp_test"],
  ["an upper-case loopback host", "postgres://postgres:postgres@LOCALHOST:5432/tdp_test"],
] as const;

const REFUSED_URLS = [
  ["the dev database", "postgres://postgres:postgres@localhost:5432/tdp"],
  ["a remote host", "postgres://user:password@db.example.internal:6543/tdp_test"],
  ["a missing database name", "postgres://user:password@localhost:5433"],
  [
    "a host query parameter",
    "postgres://user:password@localhost:5434/tdp_test?host=/var/run/elsewhere",
  ],
  [
    "an upper-case host query parameter",
    "postgres://user:password@localhost:5434/tdp_test?HOST=/var/run/elsewhere",
  ],
  [
    "a mixed-case host query parameter",
    "postgres://user:password@localhost:5434/tdp_test?Host=/var/run/elsewhere",
  ],
  [
    "a test name in the second path segment",
    "postgres://user:password@localhost:5432/tdp/tdp_test",
  ],
  ["a second path segment ending in _test", "postgres://user:password@localhost:5432/tdp/x_test"],
  ["an empty path segment", "postgres://user:password@localhost:5432/tdp//x_test"],
  ["a dot-dot path segment", "postgres://user:password@localhost:5432/tdp/.._test"],
  ["an empty first path segment", "postgres://user:password@localhost:5432//tdp_test"],
  [
    "a name that only starts like a test database",
    "postgres://user:password@localhost:5432/tdp_testing",
  ],
  [
    "a name ending in test without the underscore",
    "postgres://user:password@localhost:5432/contest",
  ],
  ["a mysql URL", "mysql://user:password@localhost:3306/tdp_test"],
  ["a Prisma Postgres URL", "prisma+postgres://localhost/x_test"],
] as const;

const UNPARSEABLE_URL = "::not a database url::";

const messageOf = (run: () => unknown): string => {
  try {
    run();
  } catch (error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }

  throw new Error("expected the target guard to throw, but it returned normally");
};

const partsOf = (databaseUrl: string): string[] => {
  const target = new URL(databaseUrl);

  return [
    target.username,
    target.password,
    target.hostname,
    target.port,
    target.pathname.slice(1),
    ...target.searchParams.values(),
  ].filter((part) => part !== "");
};

describe("isTestDatabaseTarget", () => {
  it.each(ACCEPTED_TARGETS)("accepts %s", (_, databaseUrl) => {
    expect(isTestDatabaseTarget(databaseUrl)).toBe(true);
  });

  it.each(REFUSED_URLS)("refuses %s", (_, databaseUrl) => {
    expect(isTestDatabaseTarget(databaseUrl)).toBe(false);
  });

  it("refuses an unparseable string, an empty string and an undefined URL", () => {
    expect(isTestDatabaseTarget(UNPARSEABLE_URL)).toBe(false);
    expect(isTestDatabaseTarget("")).toBe(false);
    expect(isTestDatabaseTarget(undefined)).toBe(false);
  });
});

describe("assertTestDatabaseTarget", () => {
  it.each(ACCEPTED_TARGETS)("lets %s through", (_, databaseUrl) => {
    expect(() => assertTestDatabaseTarget(databaseUrl)).not.toThrow();
  });

  it.each(REFUSED_URLS)("names what to run instead of %s", (_, databaseUrl) => {
    const message = messageOf(() => assertTestDatabaseTarget(databaseUrl));

    expect(message).toContain("refusing to run the api-server tests");
    expect(message).toContain("task test:api");
  });

  it.each(REFUSED_URLS)("prints no part of %s", (_, databaseUrl) => {
    const message = messageOf(() => assertTestDatabaseTarget(databaseUrl));

    for (const part of partsOf(databaseUrl)) {
      expect(message).not.toContain(part);
    }
  });

  it("prints no part of an unparseable string", () => {
    expect(messageOf(() => assertTestDatabaseTarget(UNPARSEABLE_URL))).not.toContain(
      UNPARSEABLE_URL,
    );
  });

  it("refuses an empty and an undefined URL", () => {
    expect(() => assertTestDatabaseTarget("")).toThrow("DATABASE_URL is not set");
    expect(() => assertTestDatabaseTarget(undefined)).toThrow("DATABASE_URL is not set");
  });
});
