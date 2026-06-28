import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useSubmitToken } from "./use-submit-token";

describe("useSubmitToken", () => {
  it("returns the same token from get across repeated calls", () => {
    const { result } = renderHook(() => useSubmitToken());

    expect(result.current.get()).toBe(result.current.get());
  });

  it("mints a different token from get after reset", () => {
    const { result } = renderHook(() => useSubmitToken());

    const before = result.current.get();

    result.current.reset();

    expect(result.current.get()).not.toBe(before);
  });

  it("keeps a stable handle identity across renders", () => {
    const { result, rerender } = renderHook(() => useSubmitToken());

    const firstHandle = result.current;

    rerender();

    expect(result.current).toBe(firstHandle);
  });
});
