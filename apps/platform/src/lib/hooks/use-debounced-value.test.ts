import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebouncedValue } from "./use-debounced-value";

const DELAY_MS = 250;

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("first", DELAY_MS));

    expect(result.current).toBe("first");
  });

  it("holds the previous value until the delay elapses after a change", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, DELAY_MS), {
      initialProps: { value: "first" },
    });

    rerender({ value: "second" });

    expect(result.current).toBe("first");

    act(() => {
      vi.advanceTimersByTime(DELAY_MS);
    });

    expect(result.current).toBe("second");
  });

  it("debounces rapid changes to only the last value", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, DELAY_MS), {
      initialProps: { value: "a" },
    });

    rerender({ value: "ab" });
    rerender({ value: "abc" });

    act(() => {
      vi.advanceTimersByTime(DELAY_MS);
    });

    expect(result.current).toBe("abc");
  });
});
