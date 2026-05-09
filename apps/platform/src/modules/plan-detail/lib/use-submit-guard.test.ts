import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useSubmitGuard } from "./use-submit-guard";

describe("useSubmitGuard", () => {
  it("invokes the wrapped submit at most once while a previous call is still pending", async () => {
    let resolveInner: (() => void) | null = null;
    const inner = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveInner = resolve;
        }),
    );

    const { result } = renderHook(() => useSubmitGuard(inner));

    let firstCall: Promise<void> = Promise.resolve();

    act(() => {
      firstCall = result.current();
    });

    act(() => {
      void result.current();
      void result.current();
    });

    expect(inner).toHaveBeenCalledTimes(1);

    if (resolveInner !== null) {
      (resolveInner as () => void)();
    }

    await firstCall;
  });

  it("re-arms after the previous call resolves so the next click can fire a new submit", async () => {
    const inner = vi.fn(() => Promise.resolve());

    const { result } = renderHook(() => useSubmitGuard(inner));

    await act(async () => {
      await result.current();
    });

    await act(async () => {
      await result.current();
    });

    expect(inner).toHaveBeenCalledTimes(2);
  });

  it("re-arms after the wrapped submit throws so the user can retry", async () => {
    const inner = vi.fn(() => Promise.reject(new Error("boom")));

    const { result } = renderHook(() => useSubmitGuard(inner));

    await act(async () => {
      await expect(result.current()).rejects.toThrow("boom");
    });

    await act(async () => {
      await expect(result.current()).rejects.toThrow("boom");
    });

    expect(inner).toHaveBeenCalledTimes(2);
  });
});
