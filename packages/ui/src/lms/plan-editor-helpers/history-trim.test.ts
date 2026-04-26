import { describe, expect, it } from "vitest";

import { trimHistoryStack } from "./history-trim";

describe("trimHistoryStack", () => {
  it("returns array unchanged when below capacity", () => {
    const stack = [1, 2, 3];
    const result = trimHistoryStack(stack, 5);

    expect(result).toEqual([1, 2, 3]);
    expect(result).not.toBe(stack);
  });

  it("trims from the head when exceeding capacity", () => {
    const stack = Array.from({ length: 60 }, (_, i) => i);
    const result = trimHistoryStack(stack, 50);

    expect(result).toHaveLength(50);
    expect(result[0]).toBe(10);
    expect(result[result.length - 1]).toBe(59);
  });

  it("respects custom capacity boundary", () => {
    const stack = [1, 2, 3, 4];
    const result = trimHistoryStack(stack, 2);

    expect(result).toEqual([3, 4]);
  });
});
