import { describe, expect, it } from "vitest";

import { GOLDEN_BCRYPT_HASH } from "../src/test/golden-fixture";

import {
  EXPECT_DATABASE_FLAG,
  EXPECT_HOST_FLAG,
  EXPECT_PLAN_FLAG,
  hasFlag,
  parseTarget,
  readExpectedPlan,
  readFlag,
  rejectUnknownFlags,
  requireEnv,
  requireExpectedDatabase,
  requireExpectedHost,
  requireExpectedPlan,
  requireFlag,
  requireNamedHost,
  requireAttestedTarget,
  WRITE_FLAG,
} from "./script-target-guard";

const SCHEME = "postgresql:";
const SECRET_PASSWORD = "sup3r-s3cret-passw0rd";
const TARGET_HOST = "db.example-target.invalid";
const TARGET_AUTHORITY = `${TARGET_HOST}:5432`;
const TARGET_DATABASE = "platform";
const DSN = `${SCHEME}//importer:${SECRET_PASSWORD}@${TARGET_HOST}:5432/platform`;
const HOSTLESS_DSN = `${SCHEME}///platform`;

const messageOf = (run: () => unknown): string => {
  try {
    run();
  } catch (error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }

  throw new Error("expected the guard to throw, but it returned normally");
};

const expectNoLeak = (message: string): void => {
  expect(message).not.toContain(SECRET_PASSWORD);
  expect(message).not.toContain(TARGET_HOST);
  expect(message).not.toContain(DSN);
};

describe("readFlag", () => {
  it("returns null when the flag is absent", () => {
    expect(readFlag(["node", "script.ts"], EXPECT_HOST_FLAG)).toBeNull();
  });

  it("returns the value when the flag is stated once", () => {
    expect(readFlag(["node", `${EXPECT_HOST_FLAG}${TARGET_HOST}`], EXPECT_HOST_FLAG)).toBe(
      TARGET_HOST,
    );
  });

  it("returns an empty string when the flag is stated with no value", () => {
    expect(readFlag([EXPECT_HOST_FLAG], EXPECT_HOST_FLAG)).toBe("");
  });

  it("throws when the flag is repeated, rather than silently taking the first", () => {
    const message = messageOf(() =>
      readFlag([`${EXPECT_HOST_FLAG}stale`, `${EXPECT_HOST_FLAG}fresh`], EXPECT_HOST_FLAG),
    );

    expect(message).toContain("exactly once");
    expect(message).toContain("2 times");
  });

  it("does not match a flag that merely shares a prefix", () => {
    expect(readFlag(["--expect-hostname=other"], EXPECT_HOST_FLAG)).toBeNull();
  });
});

describe("requireFlag", () => {
  it("returns the stated value", () => {
    expect(requireFlag(["--source=/tmp/users.json"], "--source=")).toBe("/tmp/users.json");
  });

  it("throws when the flag is absent", () => {
    expect(messageOf(() => requireFlag([], "--source="))).toContain("--source=<value> is required");
  });

  it("throws when the flag is present but empty", () => {
    expect(messageOf(() => requireFlag(["--source="], "--source="))).toContain("empty value");
  });
});

describe("hasFlag", () => {
  it("is false when the flag is absent", () => {
    expect(hasFlag(["node", "script.ts"], WRITE_FLAG)).toBe(false);
  });

  it("is true when the flag is stated once", () => {
    expect(hasFlag([WRITE_FLAG], WRITE_FLAG)).toBe(true);
  });

  it("throws when the flag is repeated", () => {
    expect(messageOf(() => hasFlag([WRITE_FLAG, WRITE_FLAG], WRITE_FLAG))).toContain(
      "at most once",
    );
  });

  it("does not match a longer flag that starts with the same text", () => {
    expect(hasFlag(["--write-through"], WRITE_FLAG)).toBe(false);
  });
});

describe("rejectUnknownFlags", () => {
  const KNOWN = ["--source=", "--write", "--expect-host="];

  it("accepts a command line made only of known flags", () => {
    expect(() =>
      rejectUnknownFlags(["node", "script.ts", "--source=/tmp/x", "--write"], KNOWN),
    ).not.toThrow();
  });

  it("refuses a misspelled flag rather than silently ignoring it, and names it", () => {
    const message = messageOf(() =>
      rejectUnknownFlags(["node", "script.ts", "--sorce=/tmp/x"], KNOWN),
    );

    expect(message).toContain("unrecognised flag");
    expect(message).toContain("--sorce=");
  });

  it("names only the flag, never the value — a typo is where a credential lands", () => {
    const message = messageOf(() =>
      rejectUnknownFlags(["node", "script.ts", `--expect-pan=${GOLDEN_BCRYPT_HASH}`], KNOWN),
    );

    expect(message).toContain("--expect-pan=");
    expect(message).not.toContain(GOLDEN_BCRYPT_HASH);
    expect(message).not.toContain("$2a$");
  });

  it("names a misspelled boolean flag whole, having no value to withhold", () => {
    const message = messageOf(() => rejectUnknownFlags(["node", "script.ts", "--wrote"], KNOWN));

    expect(message).toContain("--wrote");
  });

  it("refuses a near-miss of a real flag, which is the dangerous case", () => {
    expect(() => rejectUnknownFlags(["node", "script.ts", "--expect_host=x"], KNOWN)).toThrow(
      /unrecognised flag/,
    );
  });

  it("refuses a boolean flag carrying a value, which the runner would silently ignore", () => {
    expect(() => rejectUnknownFlags(["node", "script.ts", "--write=true"], KNOWN)).toThrow(
      /unrecognised flag/,
    );
  });

  it("refuses a boolean flag with trailing characters", () => {
    expect(() => rejectUnknownFlags(["node", "script.ts", "--writex"], KNOWN)).toThrow(
      /unrecognised flag/,
    );
    expect(() =>
      rejectUnknownFlags(
        ["node", "script.ts", "--restore-credentialsX"],
        [...KNOWN, "--restore-credentials"],
      ),
    ).toThrow(/unrecognised flag/);
  });

  it("still accepts a value flag written with its equals sign", () => {
    expect(() =>
      rejectUnknownFlags(["node", "script.ts", "--expect-host=db.example.invalid"], KNOWN),
    ).not.toThrow();
  });

  it("ignores the node argv preamble, however it was invoked", () => {
    expect(() => rejectUnknownFlags(["node", "--experimental-x", "--write"], KNOWN)).not.toThrow();
  });

  it("refuses a bare argument, without printing what it was", () => {
    const message = messageOf(() =>
      rejectUnknownFlags(["node", "script.ts", "/home/me/secret-export.json"], KNOWN),
    );

    expect(message).toContain("flags only");
    expect(message).not.toContain("secret-export");
  });
});

describe("requireEnv", () => {
  it("returns the value when set", () => {
    expect(requireEnv({ DATABASE_URL: DSN }, "DATABASE_URL")).toBe(DSN);
  });

  it("throws when unset", () => {
    expect(messageOf(() => requireEnv({}, "DATABASE_URL"))).toContain("DATABASE_URL is required");
  });

  it("throws when set to an empty string", () => {
    expect(messageOf(() => requireEnv({ DATABASE_URL: "" }, "DATABASE_URL"))).toContain(
      "is required",
    );
  });

  it("never echoes the value it rejected", () => {
    expectNoLeak(messageOf(() => requireEnv({}, "DATABASE_URL")));
  });
});

describe("parseTarget", () => {
  it("parses a well formed DSN", () => {
    expect(parseTarget(DSN).hostname).toBe(TARGET_HOST);
  });

  it("throws on an unparseable DSN without printing it", () => {
    const message = messageOf(() => parseTarget(`not-a-url ${SECRET_PASSWORD}`));

    expect(message).toContain("deliberately not printed");
    expect(message).not.toContain(SECRET_PASSWORD);
  });
});

describe("requireNamedHost", () => {
  it("accepts a DSN that names a host", () => {
    expect(() => requireNamedHost(parseTarget(DSN))).not.toThrow();
  });

  it("refuses a hostless DSN, because no expected host could attest to it", () => {
    const message = messageOf(() => requireNamedHost(parseTarget(HOSTLESS_DSN)));

    expect(message).toContain("names no host");
    expect(message).toContain("refusing to run");
  });

  it("refuses a DSN whose host query parameter would override the authority host", () => {
    const decoyed = `${SCHEME}//importer:${SECRET_PASSWORD}@${TARGET_HOST}:5432/platform?host=elsewhere.invalid`;
    const message = messageOf(() => requireNamedHost(parseTarget(decoyed)));

    expect(message).toContain("refusing to run");
    expect(message).toContain("host query parameter");
  });

  it("accepts a DSN carrying unrelated query parameters", () => {
    const withParams = `${SCHEME}//importer:${SECRET_PASSWORD}@${TARGET_HOST}:5432/platform?sslmode=require&connect_timeout=10`;

    expect(() => requireNamedHost(parseTarget(withParams))).not.toThrow();
  });
});

describe("requireExpectedHost", () => {
  const target = parseTarget(DSN);

  it("accepts a stated host that matches the DSN", () => {
    expect(() =>
      requireExpectedHost([WRITE_FLAG, `${EXPECT_HOST_FLAG}${TARGET_AUTHORITY}`], target),
    ).not.toThrow();
  });

  it("refuses when the flag is missing", () => {
    const message = messageOf(() => requireExpectedHost([WRITE_FLAG], target));

    expect(message).toContain(`${EXPECT_HOST_FLAG}<hostname> is required`);
    expectNoLeak(message);
  });

  it("refuses when the flag is empty", () => {
    const message = messageOf(() => requireExpectedHost([WRITE_FLAG, EXPECT_HOST_FLAG], target));

    expect(message).toContain("empty value");
    expectNoLeak(message);
  });

  it("refuses when the stated host does not match", () => {
    const message = messageOf(() =>
      requireExpectedHost([WRITE_FLAG, `${EXPECT_HOST_FLAG}db.somewhere-else.invalid`], target),
    );

    expect(message).toContain("refusing to run");
    expect(message).toContain("db.somewhere-else.invalid");
    expectNoLeak(message);
  });

  it("refuses when the flag is repeated", () => {
    expect(() =>
      requireExpectedHost(
        [WRITE_FLAG, `${EXPECT_HOST_FLAG}${TARGET_HOST}`, `${EXPECT_HOST_FLAG}${TARGET_HOST}`],
        target,
      ),
    ).toThrow(/exactly once/);
  });

  it("compares hostnames case-insensitively, the way DNS does", () => {
    expect(() =>
      requireExpectedHost(
        [WRITE_FLAG, `${EXPECT_HOST_FLAG}${TARGET_AUTHORITY.toUpperCase()}`],
        target,
      ),
    ).not.toThrow();
  });
});

describe("requireExpectedDatabase", () => {
  const target = new URL(DSN);

  it("accepts a stated database that matches the DSN", () => {
    expect(() =>
      requireExpectedDatabase([`${EXPECT_DATABASE_FLAG}${TARGET_DATABASE}`], target),
    ).not.toThrow();
  });

  it("refuses when the flag is missing, in a dry run as well as a write", () => {
    expect(messageOf(() => requireExpectedDatabase([], target))).toContain(
      `${EXPECT_DATABASE_FLAG}<name> is required`,
    );
  });

  it("refuses an empty value rather than reading it as a choice", () => {
    expect(messageOf(() => requireExpectedDatabase([EXPECT_DATABASE_FLAG], target))).toContain(
      "empty value",
    );
  });

  it("refuses two databases on one host that differ only by name", () => {
    const rehearsal = new URL(
      `${SCHEME}//importer:${SECRET_PASSWORD}@${TARGET_HOST}:5432/platform_local`,
    );
    const message = messageOf(() =>
      requireExpectedDatabase([`${EXPECT_DATABASE_FLAG}${TARGET_DATABASE}`], rehearsal),
    );

    expect(message).toContain("does not match the database");
    expect(message).not.toContain("platform_local");
    expect(message).not.toContain(SECRET_PASSWORD);
  });

  it("refuses a DSN that names no database at all", () => {
    const nameless = new URL(`${SCHEME}//importer:${SECRET_PASSWORD}@${TARGET_HOST}:5432`);

    expect(
      messageOf(() => requireExpectedDatabase([`${EXPECT_DATABASE_FLAG}x`], nameless)),
    ).toContain("names no database");
  });
});

describe("requireExpectedHost — the port is part of the target", () => {
  const target = new URL(DSN);

  it("refuses a bare hostname when the DSN names a port", () => {
    const message = messageOf(() =>
      requireExpectedHost([`${EXPECT_HOST_FLAG}${TARGET_HOST}`], target),
    );

    expect(message).toContain("does not match the host");
    expect(message).not.toContain(SECRET_PASSWORD);
  });

  it("accepts a bare hostname when the DSN names no port", () => {
    const portless = new URL(`${SCHEME}//importer:${SECRET_PASSWORD}@${TARGET_HOST}/platform`);

    expect(() =>
      requireExpectedHost([`${EXPECT_HOST_FLAG}${TARGET_HOST}`], portless),
    ).not.toThrow();
  });
});

describe("requireNamedHost — the host query parameter", () => {
  it.each(["host", "HOST", "Host"])("refuses a %s query parameter whatever its case", (name) => {
    const decoy = new URL(
      `${SCHEME}//importer:${SECRET_PASSWORD}@${TARGET_HOST}:5432/platform?${name}=/var/run/postgresql`,
    );

    expect(messageOf(() => requireNamedHost(decoy))).toContain("query parameter");
  });
});

describe("requireAttestedTarget — host query parameter", () => {
  it("refuses a decoy authority host whose query parameter names the real target", () => {
    const decoyed = `${SCHEME}//importer:${SECRET_PASSWORD}@decoy.invalid:5432/platform?host=${TARGET_HOST}`;

    expect(() =>
      requireAttestedTarget([WRITE_FLAG, `${EXPECT_HOST_FLAG}decoy.invalid`], decoyed),
    ).toThrow(/host query parameter/);
  });
});

describe("requireAttestedTarget", () => {
  it("returns the parsed target when every guard passes", () => {
    const target = requireAttestedTarget(
      [
        WRITE_FLAG,
        `${EXPECT_HOST_FLAG}${TARGET_AUTHORITY}`,
        `${EXPECT_DATABASE_FLAG}${TARGET_DATABASE}`,
      ],
      DSN,
    );

    expect(target.hostname).toBe(TARGET_HOST);
  });

  it("rejects a hostless DSN before it ever compares the stated host", () => {
    expect(() =>
      requireAttestedTarget([WRITE_FLAG, `${EXPECT_HOST_FLAG}localhost`], HOSTLESS_DSN),
    ).toThrow(/names no host/);
  });

  it("rejects a mismatch even when the DSN is otherwise valid", () => {
    expect(() =>
      requireAttestedTarget([WRITE_FLAG, `${EXPECT_HOST_FLAG}wrong.invalid`], DSN),
    ).toThrow(/refusing to run/);
  });

  it("leaks neither the DSN nor the resolved host on any rejection path", () => {
    expectNoLeak(messageOf(() => requireAttestedTarget([WRITE_FLAG], DSN)));
    expectNoLeak(messageOf(() => requireAttestedTarget([WRITE_FLAG, EXPECT_HOST_FLAG], DSN)));
    expectNoLeak(
      messageOf(() => requireAttestedTarget([WRITE_FLAG, `${EXPECT_HOST_FLAG}wrong.invalid`], DSN)),
    );
  });
});

describe("readExpectedPlan", () => {
  const DIGEST = "7f3a91c04e2b";

  it("returns null when no plan was pinned", () => {
    expect(readExpectedPlan([WRITE_FLAG])).toBeNull();
  });

  it("reads a pinned digest", () => {
    expect(readExpectedPlan([`${EXPECT_PLAN_FLAG}${DIGEST}`])).toBe(DIGEST);
  });

  it("lower-cases a digest so a pasted upper-case one still matches", () => {
    expect(readExpectedPlan([`${EXPECT_PLAN_FLAG}${DIGEST.toUpperCase()}`])).toBe(DIGEST);
  });

  it("refuses anything that is not twelve hexadecimal characters", () => {
    for (const value of ["", "abc", "7f3a91c04e2bff", "7f3a91c04e2g", "7f3a 91c04e2b"]) {
      expect(() => readExpectedPlan([`${EXPECT_PLAN_FLAG}${value}`])).toThrow(
        /is not a plan digest/,
      );
    }
  });

  it("never prints back the value it rejected, in case a credential landed there", () => {
    const message = messageOf(() => readExpectedPlan([`${EXPECT_PLAN_FLAG}${DSN}`]));

    expectNoLeak(message);
  });

  it("refuses a pin stated more than once rather than taking the first", () => {
    expect(() =>
      readExpectedPlan([`${EXPECT_PLAN_FLAG}${DIGEST}`, `${EXPECT_PLAN_FLAG}0123456789ab`]),
    ).toThrow(/exactly once/);
  });
});

describe("requireExpectedPlan", () => {
  it("explains why a write cannot proceed unpinned", () => {
    const message = messageOf(() => requireExpectedPlan([WRITE_FLAG]));

    expect(message).toContain("--expect-plan=<digest> is required to write");
    expect(message).toContain("re-decides inside its own transaction");
  });

  it("returns the digest when one is pinned", () => {
    expect(requireExpectedPlan([WRITE_FLAG, `${EXPECT_PLAN_FLAG}7f3a91c04e2b`])).toBe(
      "7f3a91c04e2b",
    );
  });
});
