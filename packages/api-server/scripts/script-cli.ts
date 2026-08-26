import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseTarget } from "./script-target-guard";

export type ScriptRunResult = { lines: readonly string[]; isRefused: boolean };

export type ScriptCliDeps = {
  run: () => Promise<ScriptRunResult>;
  env: Record<string, string | undefined>;
  writeLine: (line: string) => void;
  writeError: (line: string) => void;
  fail: () => void;
};

export const withHostWithheld = (message: string, hostname: string): string =>
  hostname === "" ? message : message.replaceAll(hostname, "<host withheld>");

export const resolvedHostQuietly = (databaseUrl: string): string => {
  if (databaseUrl === "") {
    return "";
  }

  try {
    return parseTarget(databaseUrl).hostname;
  } catch {
    return "";
  }
};

export const isEntryPoint = (entryPath: string | undefined, moduleUrl: string): boolean =>
  entryPath !== undefined && resolve(entryPath) === fileURLToPath(moduleUrl);

export const closeQuietly = async (close: () => Promise<unknown>): Promise<void> => {
  await close().then(
    () => undefined,
    () => undefined,
  );
};

export const runScriptCli = async (deps: ScriptCliDeps): Promise<void> => {
  try {
    const result = await deps.run();

    for (const line of result.lines) {
      deps.writeLine(line);
    }

    if (result.isRefused) {
      deps.fail();
    }
  } catch (error: unknown) {
    const raw = error instanceof Error ? error.message : String(error);

    deps.writeError(withHostWithheld(raw, resolvedHostQuietly(deps.env.DATABASE_URL ?? "")));
    deps.fail();
  }
};

export const section = (heading: string, lines: readonly string[]): readonly string[] =>
  lines.length === 0 ? [] : ["", heading, ...lines.map((line) => `  ${line}`)];

export const duplicatesOf = <T>(values: readonly T[]): Set<T> => {
  const seen = new Set<T>();
  const repeated = new Set<T>();

  for (const value of values) {
    if (seen.has(value)) {
      repeated.add(value);
    }

    seen.add(value);
  }

  return repeated;
};
