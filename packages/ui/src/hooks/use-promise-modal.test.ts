import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePromiseModal } from "./use-promise-modal";

type Arg = { initialName: string };
type Result = { id: string };

describe("usePromiseModal", () => {
  it("starts closed with a null arg", () => {
    const { result } = renderHook(() => usePromiseModal<Arg, Result>());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.arg).toBeNull();
  });

  it("opens with the supplied arg and exposes a pending promise", () => {
    const { result } = renderHook(() => usePromiseModal<Arg, Result>());

    act(() => {
      void result.current.open({ initialName: "Sled Push" });
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.arg).toEqual({ initialName: "Sled Push" });
  });

  it("settles the open promise with the result and closes when resolve is called", async () => {
    const { result } = renderHook(() => usePromiseModal<Arg, Result>());
    let pending: Promise<Result | null> = Promise.resolve(null);

    act(() => {
      pending = result.current.open({ initialName: "Sled Push" });
    });

    act(() => {
      result.current.resolve({ id: "ex-1" });
    });

    await expect(pending).resolves.toEqual({ id: "ex-1" });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.arg).toBeNull();
  });

  it("settles the open promise with null and closes when cancel is called", async () => {
    const { result } = renderHook(() => usePromiseModal<Arg, Result>());
    let pending: Promise<Result | null> = Promise.resolve({ id: "seed" });

    act(() => {
      pending = result.current.open({ initialName: "Sled Push" });
    });

    act(() => {
      result.current.cancel();
    });

    await expect(pending).resolves.toBeNull();
    expect(result.current.isOpen).toBe(false);
    expect(result.current.arg).toBeNull();
  });

  it("settles the prior promise with null when open is called while it is still pending", async () => {
    const { result } = renderHook(() => usePromiseModal<Arg, Result>());
    let first: Promise<Result | null> = Promise.resolve({ id: "seed" });
    let second: Promise<Result | null> = Promise.resolve({ id: "seed" });

    act(() => {
      first = result.current.open({ initialName: "First" });
    });

    act(() => {
      second = result.current.open({ initialName: "Second" });
    });

    await expect(first).resolves.toBeNull();
    expect(result.current.isOpen).toBe(true);
    expect(result.current.arg).toEqual({ initialName: "Second" });

    act(() => {
      result.current.resolve({ id: "ex-2" });
    });

    await expect(second).resolves.toEqual({ id: "ex-2" });
  });

  it("resolves only the latest promise when reopened", async () => {
    const { result } = renderHook(() => usePromiseModal<Arg, Result>());
    let first: Promise<Result | null> = Promise.resolve(null);

    act(() => {
      first = result.current.open({ initialName: "First" });
    });

    act(() => {
      result.current.cancel();
    });

    await expect(first).resolves.toBeNull();

    let second: Promise<Result | null> = Promise.resolve(null);

    act(() => {
      second = result.current.open({ initialName: "Second" });
    });

    expect(result.current.arg).toEqual({ initialName: "Second" });

    act(() => {
      result.current.resolve({ id: "ex-2" });
    });

    await expect(second).resolves.toEqual({ id: "ex-2" });
  });
});
