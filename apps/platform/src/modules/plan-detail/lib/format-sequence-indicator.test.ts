import { describe, expect, it } from "vitest";

import type { SequenceIndicator } from "@repo/contracts/lms/_shared";

import { formatSequenceIndicator } from "./format-sequence-indicator";

describe("formatSequenceIndicator", () => {
  it("renders 'before <label>' for before_named", () => {
    const s: SequenceIndicator = { kind: "before_named", targetLabel: "deadlift" };

    expect(formatSequenceIndicator(s)).toBe("before deadlift");
  });

  it("renders 'after <label>' for after_named", () => {
    const s: SequenceIndicator = { kind: "after_named", targetLabel: "snatch" };

    expect(formatSequenceIndicator(s)).toBe("after snatch");
  });

  it("renders 'between <before> & <after>' for the composite kind", () => {
    const s: SequenceIndicator = {
      kind: "before_named_after_named_composite",
      beforeLabel: "warmup",
      afterLabel: "main",
    };

    expect(formatSequenceIndicator(s)).toBe("between warmup & main");
  });

  it("renders 'once before <label>' for only_once_before", () => {
    const s: SequenceIndicator = { kind: "only_once_before", targetLabel: "amrap" };

    expect(formatSequenceIndicator(s)).toBe("once before amrap");
  });

  it("renders 'after each round' literal for after_each_round", () => {
    const s: SequenceIndicator = { kind: "after_each_round" };

    expect(formatSequenceIndicator(s)).toBe("after each round");
  });

  it("renders 'after each <type> round' for after_each_typed_round", () => {
    const s: SequenceIndicator = { kind: "after_each_typed_round", type: "heavy" };

    expect(formatSequenceIndicator(s)).toBe("after each heavy round");
  });
});
