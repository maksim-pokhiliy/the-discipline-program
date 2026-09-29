import {
  databaseNameOf,
  hasHostQueryParam,
  HOST_QUERY_PARAM,
  parseTarget,
} from "../../scripts/script-target-guard";

const POSTGRES_PROTOCOLS: ReadonlySet<string> = new Set(["postgres:", "postgresql:"]);
const LOOPBACK_HOSTS: ReadonlySet<string> = new Set(["localhost", "127.0.0.1", "::1"]);
const BRACKETED_IPV6_HOST = /^\[(.*)\]$/;
const PATH_SEGMENT_SEPARATOR = "/";
const TEST_DATABASE_NAME = "test";
const TEST_DATABASE_NAME_SUFFIX = "_test";

const RUN_INSTEAD =
  "Run the suite through `task test:api` or `task test`, or export a DATABASE_URL that points " +
  "at a test database: a loopback host and a database named test or ending in _test.";

const hostOf = (target: URL): string =>
  target.hostname.toLowerCase().replace(BRACKETED_IPV6_HOST, "$1");

const namesOnePathSegment = (target: URL): boolean =>
  !databaseNameOf(target).includes(PATH_SEGMENT_SEPARATOR);

const isTestDatabaseName = (name: string): boolean =>
  name === TEST_DATABASE_NAME || name.endsWith(TEST_DATABASE_NAME_SUFFIX);

const findRefusal = (databaseUrl: string | undefined): string | null => {
  if (databaseUrl === undefined || databaseUrl === "") {
    return "DATABASE_URL is not set";
  }

  if (!URL.canParse(databaseUrl)) {
    return "DATABASE_URL is not a parseable URL";
  }

  const target = parseTarget(databaseUrl);

  if (!POSTGRES_PROTOCOLS.has(target.protocol)) {
    return "DATABASE_URL does not use the postgres or postgresql scheme";
  }

  if (hasHostQueryParam(target)) {
    return `DATABASE_URL carries a ${HOST_QUERY_PARAM} query parameter, which overrides its host at connect time`;
  }

  if (!LOOPBACK_HOSTS.has(hostOf(target))) {
    return "DATABASE_URL does not point at a loopback host";
  }

  if (!namesOnePathSegment(target)) {
    return "DATABASE_URL names more than one path segment, and the client connects to the database the first one names";
  }

  if (!isTestDatabaseName(databaseNameOf(target))) {
    return "DATABASE_URL does not name a test database";
  }

  return null;
};

export const isTestDatabaseTarget = (databaseUrl: string | undefined): boolean =>
  findRefusal(databaseUrl) === null;

export const assertTestDatabaseTarget = (databaseUrl: string | undefined): void => {
  const refusal = findRefusal(databaseUrl);

  if (refusal !== null) {
    throw new Error(
      `refusing to run the api-server tests: ${refusal}. Its value is deliberately not printed. ` +
        RUN_INSTEAD,
    );
  }
};
