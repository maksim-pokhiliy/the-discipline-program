import { describe, expect, it } from "vitest";

import {
  closeQuietly,
  duplicatesOf,
  isEntryPoint,
  resolvedHostQuietly,
  runScriptCli,
  section,
  withHostWithheld,
} from "./script-cli";

const HOSTNAME = "db.example-target.invalid";
const SECRET = "hunter2";
const DSN = `${"postgresql:"}//importer:${SECRET}@${HOSTNAME}:5432/platform`;

const collect = () => {
  const lines: string[] = [];
  const errors: string[] = [];
  const failures: number[] = [];

  return {
    lines,
    errors,
    failures,
    writeLine: (line: string) => lines.push(line),
    writeError: (line: string) => errors.push(line),
    fail: () => failures.push(1),
  };
};

describe("runScriptCli", () => {
  it("prints every report line and leaves the exit code alone on a clean run", async () => {
    const sink = collect();

    await runScriptCli({
      ...sink,
      env: { DATABASE_URL: DSN },
      run: () => Promise.resolve({ lines: ["head", "body"], isRefused: false }),
    });

    expect(sink.lines).toEqual(["head", "body"]);
    expect(sink.failures).toEqual([]);
  });

  it("still prints the report when the run refused, and fails the process", async () => {
    const sink = collect();

    await runScriptCli({
      ...sink,
      env: { DATABASE_URL: DSN },
      run: () => Promise.resolve({ lines: ["REFUSED"], isRefused: true }),
    });

    expect(sink.lines).toEqual(["REFUSED"]);
    expect(sink.failures).toHaveLength(1);
  });

  it("takes the resolved host out of a thrown message before printing it", async () => {
    const sink = collect();

    await runScriptCli({
      ...sink,
      env: { DATABASE_URL: DSN },
      run: () => Promise.reject(new Error(`connect ECONNREFUSED ${HOSTNAME}:5432`)),
    });

    expect(sink.errors).toEqual(["connect ECONNREFUSED <host withheld>:5432"]);
    expect(sink.failures).toHaveLength(1);
  });

  it("prints a non-error rejection rather than swallowing it", async () => {
    const sink = collect();

    await runScriptCli({
      ...sink,
      env: {},
      run: () => Promise.reject("something odd"),
    });

    expect(sink.errors).toEqual(["something odd"]);
  });

  it("withholds nothing when the DSN itself cannot be parsed", async () => {
    const sink = collect();

    await runScriptCli({
      ...sink,
      env: { DATABASE_URL: "not a url" },
      run: () => Promise.reject(new Error("plain failure")),
    });

    expect(sink.errors).toEqual(["plain failure"]);
  });
});

describe("resolvedHostQuietly", () => {
  it("reads the host out of a usable DSN", () => {
    expect(resolvedHostQuietly(DSN)).toBe(HOSTNAME);
  });

  it("returns nothing for an empty or unparseable DSN rather than throwing", () => {
    expect(resolvedHostQuietly("")).toBe("");
    expect(resolvedHostQuietly("not a url")).toBe("");
  });
});

describe("withHostWithheld", () => {
  it("replaces every occurrence, not just the first", () => {
    expect(withHostWithheld(`${HOSTNAME} then ${HOSTNAME}`, HOSTNAME)).toBe(
      "<host withheld> then <host withheld>",
    );
  });

  it("leaves a message alone when no host could be resolved", () => {
    expect(withHostWithheld("something broke", "")).toBe("something broke");
  });
});

describe("closeQuietly", () => {
  it("never lets a failing close replace the outcome the run already produced", async () => {
    await expect(
      closeQuietly(() => Promise.reject(new Error("disconnect failed"))),
    ).resolves.toBeUndefined();
  });

  it("awaits a close that succeeds", async () => {
    const closed: number[] = [];

    await closeQuietly(() => {
      closed.push(1);

      return Promise.resolve();
    });

    expect(closed).toEqual([1]);
  });
});

describe("isEntryPoint", () => {
  it("is false when the process was started by something else", () => {
    expect(isEntryPoint(undefined, import.meta.url)).toBe(false);
    expect(isEntryPoint("/somewhere/else.ts", import.meta.url)).toBe(false);
  });
});

describe("section", () => {
  it("renders nothing at all for an empty block", () => {
    expect(section("HEADING", [])).toEqual([]);
  });

  it("indents every line under a blank-separated heading", () => {
    expect(section("HEADING", ["one", "two"])).toEqual(["", "HEADING", "  one", "  two"]);
  });
});

describe("duplicatesOf", () => {
  it("names only the values that repeat", () => {
    expect([...duplicatesOf([1, 2, 2, 3, 3, 3])]).toEqual([2, 3]);
  });

  it("is empty when nothing repeats", () => {
    expect([...duplicatesOf(["a", "b"])]).toEqual([]);
  });
});
