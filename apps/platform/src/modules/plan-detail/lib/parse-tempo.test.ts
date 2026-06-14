import { describe, expect, it } from "vitest";

import { parseTempo } from "./parse-tempo";

describe("parseTempo structured input (QA-004, QA-101)", () => {
  it("parses a four-position tempo with an X hold", () => {
    expect(parseTempo("3-1-X-0")).toStrictEqual({
      eccentric: 3,
      pauseBottom: 1,
      concentric: "X",
      pauseTop: 0,
    });
  });

  it("treats empty input as a cleared tempo (null)", () => {
    expect(parseTempo("")).toBeNull();
  });

  it("treats whitespace-only input as a cleared tempo", () => {
    expect(parseTempo("   ")).toBeNull();
  });

  it("folds a lowercase x to the X hold", () => {
    expect(parseTempo("x-X-0-3")).toStrictEqual({
      eccentric: "X",
      pauseBottom: "X",
      concentric: 0,
      pauseTop: 3,
    });
  });

  it("accepts whitespace as a separator", () => {
    expect(parseTempo("3 1 X 0")).toStrictEqual({
      eccentric: 3,
      pauseBottom: 1,
      concentric: "X",
      pauseTop: 0,
    });
  });

  it("accepts a slash as a separator", () => {
    expect(parseTempo("3/1/X/0")).toStrictEqual({
      eccentric: 3,
      pauseBottom: 1,
      concentric: "X",
      pauseTop: 0,
    });
  });

  it("accepts the all-zero boundary", () => {
    expect(parseTempo("0-0-0-0")).toStrictEqual({
      eccentric: 0,
      pauseBottom: 0,
      concentric: 0,
      pauseTop: 0,
    });
  });

  it("accepts the upper 60 boundary", () => {
    expect(parseTempo("60-60-60-60")).toStrictEqual({
      eccentric: 60,
      pauseBottom: 60,
      concentric: 60,
      pauseTop: 60,
    });
  });
});

describe("parseTempo free-string fallback (QA-004, QA-101)", () => {
  it("falls back to the trimmed free string for non-4-digit text", () => {
    expect(parseTempo("3-1")).toBe("3-1");
  });

  it("stores verbal tempo verbatim", () => {
    expect(parseTempo("slow tempo")).toBe("slow tempo");
  });

  it("trims the surrounding whitespace of a free string", () => {
    expect(parseTempo("  explosive  ")).toBe("explosive");
  });

  it("falls back for too many tokens", () => {
    expect(parseTempo("3-1-1-1-1")).toBe("3-1-1-1-1");
  });

  it("falls back for a position above 60", () => {
    expect(parseTempo("61-0-0-0")).toBe("61-0-0-0");
  });

  it("falls back for a negative position", () => {
    expect(parseTempo("-1-0-0-0")).toBe("-1-0-0-0");
  });

  it("falls back for a collapsed separator that drops below four tokens", () => {
    expect(parseTempo("3--1-0")).toBe("3--1-0");
  });

  it("falls back for non-numeric text", () => {
    expect(parseTempo("abc")).toBe("abc");
  });

  it("falls back for a decimal position", () => {
    expect(parseTempo("3.5-1-X-0")).toBe("3.5-1-X-0");
  });

  it("falls back for a leading-zero position that does not round-trip", () => {
    expect(parseTempo("03-1-X-0")).toBe("03-1-X-0");
  });

  it("falls back for a fullwidth digit", () => {
    expect(parseTempo("３-1-X-0")).toBe("３-1-X-0");
  });

  it("falls back for a trailing separator (empty final token)", () => {
    expect(parseTempo("3-1-X-")).toBe("3-1-X-");
  });
});
