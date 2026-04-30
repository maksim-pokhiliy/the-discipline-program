import { describe, expect, it } from "vitest";

import { findCaretTrigger } from "./caret-trigger";

const triggers = ["/", "@"] as const;

describe("findCaretTrigger", () => {
  it("returns null when caret has no trigger before it", () => {
    expect(findCaretTrigger("hello world", 5, triggers)).toBeNull();
  });

  it("captures slash query", () => {
    const result = findCaretTrigger("/emo", 4, triggers);

    expect(result).toEqual({ kind: "/", query: "emo" });
  });

  it("captures at query in the middle of text", () => {
    const result = findCaretTrigger("note about @str", 15, triggers);

    expect(result).toEqual({ kind: "@", query: "str" });
  });

  it("breaks search on whitespace before trigger", () => {
    expect(findCaretTrigger("plain /emo word", 15, triggers)).toBeNull();
  });

  it("captures empty query right after trigger", () => {
    const result = findCaretTrigger("/", 1, triggers);

    expect(result).toEqual({ kind: "/", query: "" });
  });
});
