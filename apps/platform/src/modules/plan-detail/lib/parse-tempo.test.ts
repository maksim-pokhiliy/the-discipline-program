import { describe, expect, it } from "vitest";

import { parseTempo } from "./parse-tempo";

const TEMPO_ERROR = "Tempo must be 4 positions, each 0–60 or X, e.g. 3-1-X-0";

describe("parseTempo valid input (QA-004, QA-101)", () => {
  it("parses a four-position tempo with an X hold", () => {
    expect(parseTempo("3-1-X-0")).toStrictEqual({
      ok: true,
      value: { eccentric: 3, pauseBottom: 1, concentric: "X", pauseTop: 0 },
    });
  });

  it("treats empty input as a cleared tempo (null, not an error)", () => {
    expect(parseTempo("")).toStrictEqual({ ok: true, value: null });
  });

  it("treats whitespace-only input as a cleared tempo", () => {
    expect(parseTempo("   ")).toStrictEqual({ ok: true, value: null });
  });

  it("folds a lowercase x to the X hold", () => {
    expect(parseTempo("x-X-0-3")).toStrictEqual({
      ok: true,
      value: { eccentric: "X", pauseBottom: "X", concentric: 0, pauseTop: 3 },
    });
  });

  it("accepts whitespace as a separator", () => {
    expect(parseTempo("3 1 X 0")).toStrictEqual({
      ok: true,
      value: { eccentric: 3, pauseBottom: 1, concentric: "X", pauseTop: 0 },
    });
  });

  it("accepts a slash as a separator", () => {
    expect(parseTempo("3/1/X/0")).toStrictEqual({
      ok: true,
      value: { eccentric: 3, pauseBottom: 1, concentric: "X", pauseTop: 0 },
    });
  });

  it("accepts the all-zero boundary", () => {
    expect(parseTempo("0-0-0-0")).toStrictEqual({
      ok: true,
      value: { eccentric: 0, pauseBottom: 0, concentric: 0, pauseTop: 0 },
    });
  });

  it("accepts the upper 60 boundary", () => {
    expect(parseTempo("60-60-60-60")).toStrictEqual({
      ok: true,
      value: { eccentric: 60, pauseBottom: 60, concentric: 60, pauseTop: 60 },
    });
  });
});

describe("parseTempo invalid input (QA-004, QA-101)", () => {
  it("rejects too few tokens", () => {
    expect(parseTempo("3-1")).toStrictEqual({ ok: false, error: TEMPO_ERROR });
  });

  it("rejects too many tokens", () => {
    expect(parseTempo("3-1-1-1-1")).toStrictEqual({ ok: false, error: TEMPO_ERROR });
  });

  it("rejects a position above 60", () => {
    expect(parseTempo("61-0-0-0")).toStrictEqual({ ok: false, error: TEMPO_ERROR });
  });

  it("rejects a negative position", () => {
    expect(parseTempo("-1-0-0-0")).toStrictEqual({ ok: false, error: TEMPO_ERROR });
  });

  it("rejects a collapsed separator that drops below four tokens", () => {
    expect(parseTempo("3--1-0")).toStrictEqual({ ok: false, error: TEMPO_ERROR });
  });

  it("rejects non-numeric text", () => {
    expect(parseTempo("abc")).toStrictEqual({ ok: false, error: TEMPO_ERROR });
  });

  it("rejects a decimal position", () => {
    expect(parseTempo("3.5-1-X-0")).toStrictEqual({ ok: false, error: TEMPO_ERROR });
  });

  it("rejects a leading-zero position that does not round-trip", () => {
    expect(parseTempo("03-1-X-0")).toStrictEqual({ ok: false, error: TEMPO_ERROR });
  });

  it("rejects a fullwidth digit", () => {
    expect(parseTempo("３-1-X-0")).toStrictEqual({ ok: false, error: TEMPO_ERROR });
  });

  it("rejects a trailing separator (empty final token)", () => {
    expect(parseTempo("3-1-X-")).toStrictEqual({ ok: false, error: TEMPO_ERROR });
  });
});
