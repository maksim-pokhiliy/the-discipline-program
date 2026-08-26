import { contentHash } from "../src/utils/hash";

export const WRITE_FLAG = "--write";
export const EXPECT_HOST_FLAG = "--expect-host=";
export const EXPECT_PLAN_FLAG = "--expect-plan=";
export const EXPECT_DATABASE_FLAG = "--expect-database=";
export const RESTORE_CREDENTIALS_FLAG = "--restore-credentials";

export const PLAN_DIGEST_LENGTH = 12;

const PLAN_DIGEST_PATTERN = new RegExp(`^[0-9a-f]{${String(PLAN_DIGEST_LENGTH)}}$`, "i");

export const readFlag = (argv: readonly string[], prefix: string): string | null => {
  const matches = argv.filter((candidate) => candidate.startsWith(prefix));

  if (matches.length > 1) {
    throw new Error(
      `state ${prefix}<value> exactly once. This run passed it ${matches.length} times and only ` +
        "the first one would count; a corrected value appended after a stale one would be " +
        "silently ignored.",
    );
  }

  const [arg] = matches;

  return arg === undefined ? null : arg.slice(prefix.length);
};

export const requireFlag = (argv: readonly string[], prefix: string): string => {
  const value = readFlag(argv, prefix);

  if (value === null) {
    throw new Error(`${prefix}<value> is required.`);
  }

  if (value === "") {
    throw new Error(
      `${prefix} was passed with an empty value. An empty string states nothing, so it cannot ` +
        "stand as a deliberate choice. Write the value out.",
    );
  }

  return value;
};

export const hasFlag = (argv: readonly string[], flag: string): boolean => {
  const matches = argv.filter((candidate) => candidate === flag);

  if (matches.length > 1) {
    throw new Error(
      `state ${flag} at most once. This run passed it ${matches.length} times, which reads as a ` +
        "command line assembled by accident rather than on purpose.",
    );
  }

  return matches.length === 1;
};

export const requireEnv = (env: Record<string, string | undefined>, name: string): string => {
  const value = env[name];

  if (value === undefined || value === "") {
    throw new Error(`${name} is required. Export it for this run only, never commit it.`);
  }

  return value;
};

export const parseTarget = (databaseUrl: string): URL => {
  try {
    return new URL(databaseUrl);
  } catch {
    throw new Error(
      "DATABASE_URL is not a parseable URL. Its value is deliberately not printed — check the " +
        "variable you exported.",
    );
  }
};

export const HOST_QUERY_PARAM = "host";

const hasHostQueryParam = (target: URL): boolean =>
  [...target.searchParams.keys()].some((name) => name.toLowerCase() === HOST_QUERY_PARAM);

export const authorityOf = (target: URL): string =>
  target.port === "" ? target.hostname : `${target.hostname}:${target.port}`;

export const databaseNameOf = (target: URL): string => target.pathname.replace(/^\//, "");

export const requireNamedHost = (target: URL): void => {
  if (hasHostQueryParam(target)) {
    throw new Error(
      `refusing to run: DATABASE_URL carries a ${HOST_QUERY_PARAM} query parameter, which ` +
        `overrides the host in the DSN authority at connect time. ${EXPECT_HOST_FLAG} would then ` +
        "attest to a host this run does not connect to. Remove the parameter and name the host " +
        "in the DSN itself.",
    );
  }

  if (target.hostname === "") {
    throw new Error(
      `refusing to run: DATABASE_URL names no host, so there is nothing for ${EXPECT_HOST_FLAG} ` +
        "to verify. Prisma falls back to its local default for such a DSN, which would leave the " +
        "guard attesting to a host that is not the one it connects to. Name the host in the DSN.",
    );
  }
};

export const requireExpectedHost = (argv: readonly string[], target: URL): void => {
  const expected = readFlag(argv, EXPECT_HOST_FLAG);

  if (expected === null) {
    throw new Error(
      `${EXPECT_HOST_FLAG}<hostname> is required, in a dry run as well as a write. Importing ` +
        "@prisma/client loads any .env beside it, so DATABASE_URL can arrive from a file you did " +
        "not name and a bare dry run can read a database you never meant to touch; stating the " +
        "host you expect is what makes the target deliberate.",
    );
  }

  if (expected === "") {
    throw new Error(
      `${EXPECT_HOST_FLAG} was passed with an empty value. An empty string states nothing about ` +
        "which database you meant, so it cannot stand as a deliberate target. Write the hostname " +
        "out.",
    );
  }

  if (expected.toLowerCase() !== authorityOf(target).toLowerCase()) {
    throw new Error(
      `refusing to run: ${EXPECT_HOST_FLAG}${expected} does not match the host this run ` +
        "resolved from DATABASE_URL. The resolved host is deliberately not printed — a hostname " +
        "this script derived and you copied back would attest to nothing. Compare it against " +
        "your own record of the database you meant. If that DSN names a port, the flag has to " +
        "name it too, as host:port: two databases on one host differ by nothing else.",
    );
  }
};

export const requireExpectedDatabase = (argv: readonly string[], target: URL): void => {
  const expected = readFlag(argv, EXPECT_DATABASE_FLAG);
  const actual = databaseNameOf(target);

  if (expected === null) {
    throw new Error(
      `${EXPECT_DATABASE_FLAG}<name> is required, in a dry run as well as a write. A host attests ` +
        "to a server, not to a database: a rehearsal database and the real one sit on the same " +
        "host and differ only by the name at the end of the DSN, so the host alone cannot make " +
        "the target deliberate.",
    );
  }

  if (expected === "") {
    throw new Error(
      `${EXPECT_DATABASE_FLAG} was passed with an empty value. An empty string states nothing ` +
        "about which database you meant, so it cannot stand as a deliberate target. Write the " +
        "name out.",
    );
  }

  if (actual === "") {
    throw new Error(
      `refusing to run: DATABASE_URL names no database, so there is nothing for ` +
        `${EXPECT_DATABASE_FLAG} to verify. Name the database in the DSN.`,
    );
  }

  if (expected !== actual) {
    throw new Error(
      `refusing to run: ${EXPECT_DATABASE_FLAG}${expected} does not match the database this run ` +
        "resolved from DATABASE_URL. The resolved name is deliberately not printed, for the same " +
        "reason the host is not. Compare it against your own record of the database you meant.",
    );
  }
};

const isKnownFlag = (arg: string, known: string): boolean =>
  known.endsWith("=") ? arg.startsWith(known) : arg === known;

const flagNameOf = (arg: string): string => {
  const separator = arg.indexOf("=");

  return separator === -1 ? arg : arg.slice(0, separator + 1);
};

export const rejectUnknownFlags = (argv: readonly string[], known: readonly string[]): void => {
  const positional = argv.slice(2).filter((arg) => !arg.startsWith("--"));

  if (positional.length > 0) {
    throw new Error(
      `this script takes flags only, and ${String(positional.length)} bare argument(s) were ` +
        "passed. A value that lost its flag name is exactly how a path lands where a hostname " +
        "was meant; what was passed is deliberately not printed back.",
    );
  }

  const unknown = argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .filter((arg) => !known.some((candidate) => isKnownFlag(arg, candidate)))
    .map(flagNameOf);

  if (unknown.length > 0) {
    throw new Error(
      `unrecognised flag(s): ${unknown.join(", ")}. A misspelled flag would otherwise be ignored ` +
        "and the run would quietly do something other than what you asked. Only the flag name is " +
        "printed back: a misspelled flag is exactly where a hash or a DSN lands by accident.",
    );
  }
};

const parsePlanDigest = (value: string): string => {
  if (!PLAN_DIGEST_PATTERN.test(value)) {
    throw new Error(
      `the value passed to ${EXPECT_PLAN_FLAG} is not a plan digest. A digest is the twelve ` +
        "hexadecimal characters the report prints on its plan digest line; copy that value rather " +
        "than composing one. What you passed is deliberately not printed back, in case a " +
        "credential landed in the wrong argument.",
    );
  }

  return value.toLowerCase();
};

export const readExpectedPlan = (argv: readonly string[]): string | null => {
  const pinned = readFlag(argv, EXPECT_PLAN_FLAG);

  return pinned === null ? null : parsePlanDigest(pinned);
};

export const requireExpectedPlan = (argv: readonly string[]): string => {
  const pinned = readExpectedPlan(argv);

  if (pinned === null) {
    throw new Error(
      `${EXPECT_PLAN_FLAG}<digest> is required to write. The apply re-reads this database and ` +
        "re-decides inside its own transaction, so without a digest it would write whatever the " +
        "plan has become rather than the plan you read and signed off. Run the dry run, review " +
        "its report, and pass the digest it prints.",
    );
  }

  return pinned;
};

export const requireAttestedTarget = (argv: readonly string[], databaseUrl: string): URL => {
  const target = parseTarget(databaseUrl);

  requireNamedHost(target);
  requireExpectedHost(argv, target);
  requireExpectedDatabase(argv, target);

  return target;
};

export const shortPlanDigest = (canonicalPlan: unknown): string =>
  contentHash(canonicalPlan).slice(0, PLAN_DIGEST_LENGTH);

export class PlanDigestMismatchError extends Error {
  constructor(
    public readonly pinned: string,
    public readonly recomputed: string,
  ) {
    super(
      `refusing to write: this run builds a plan with digest ${recomputed}, not the ${pinned} ` +
        "that was pinned. Nothing was written. The database moved between the dry run and this " +
        "apply, so the plan below is not the one that was reviewed.",
    );
    this.name = "PlanDigestMismatchError";
  }
}
