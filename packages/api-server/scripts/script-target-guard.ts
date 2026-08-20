export const WRITE_FLAG = "--write";
export const EXPECT_HOST_FLAG = "--expect-host=";
export const RESTORE_CREDENTIALS_FLAG = "--restore-credentials";

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

export const requireNamedHost = (target: URL): void => {
  if (target.searchParams.has(HOST_QUERY_PARAM)) {
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

  if (expected.toLowerCase() !== target.hostname.toLowerCase()) {
    throw new Error(
      `refusing to run: ${EXPECT_HOST_FLAG}${expected} does not match the host this run ` +
        "resolved from DATABASE_URL. The resolved host is deliberately not printed — a hostname " +
        "this script derived and you copied back would attest to nothing. Compare it against " +
        "your own record of the database you meant.",
    );
  }
};

export const rejectUnknownFlags = (argv: readonly string[], known: readonly string[]): void => {
  const unknown = argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .filter((arg) => !known.some((prefix) => arg === prefix || arg.startsWith(prefix)));

  if (unknown.length > 0) {
    throw new Error(
      `unrecognised flag(s): ${unknown.join(", ")}. A misspelled flag would otherwise be ignored ` +
        "and the run would quietly do something other than what you asked.",
    );
  }
};

export const requireAttestedTarget = (argv: readonly string[], databaseUrl: string): URL => {
  const target = parseTarget(databaseUrl);

  requireNamedHost(target);
  requireExpectedHost(argv, target);

  return target;
};
