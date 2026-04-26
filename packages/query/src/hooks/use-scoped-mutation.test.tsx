import { type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useScopedMutation } from "./use-scoped-mutation";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

const createDeferred = <T,>(): Deferred<T> => {
  let resolveFn!: (value: T) => void;
  let rejectFn!: (reason: unknown) => void;

  const promise = new Promise<T>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });

  return { promise, resolve: resolveFn, reject: rejectFn };
};

const buildWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  Wrapper.displayName = "TestQueryClientWrapper";

  return Wrapper;
};

describe("useScopedMutation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("serialises mutations that share the same scope id", async () => {
    const queryClient = new QueryClient();
    const wrapper = buildWrapper(queryClient);

    const deferred0 = createDeferred<number>();
    const deferred1 = createDeferred<number>();
    const deferreds: ReadonlyArray<Deferred<number>> = [deferred0, deferred1];
    const order: string[] = [];

    const mutationFn = vi.fn(async (vars: number) => {
      order.push(`start-${vars}`);
      const target = deferreds[vars];

      if (!target) {
        throw new Error(`unexpected vars value ${vars.toString()}`);
      }

      const result = await target.promise;

      order.push(`end-${vars}`);

      return result;
    });

    const mutationKey = ["scoped-mutation-test", "shared"] as const;
    const { result } = renderHook(
      () => useScopedMutation<number, number>(mutationKey, "shared-scope", mutationFn),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate(0);
      result.current.mutate(1);
      await Promise.resolve();
    });

    expect(order).toEqual(["start-0"]);

    await act(async () => {
      deferred0.resolve(0);
      await deferred0.promise;
    });

    expect(order).toEqual(["start-0", "end-0", "start-1"]);

    await act(async () => {
      deferred1.resolve(1);
      await deferred1.promise;
    });

    expect(order).toEqual(["start-0", "end-0", "start-1", "end-1"]);
    expect(mutationFn).toHaveBeenCalledTimes(2);
  });

  it("runs mutations with different scope ids in parallel", async () => {
    const queryClient = new QueryClient();
    const wrapper = buildWrapper(queryClient);

    const deferredA = createDeferred<string>();
    const deferredB = createDeferred<string>();
    const order: string[] = [];

    const mutationFnA = vi.fn(async () => {
      order.push("start-A");
      const value = await deferredA.promise;

      order.push("end-A");

      return value;
    });

    const mutationFnB = vi.fn(async () => {
      order.push("start-B");
      const value = await deferredB.promise;

      order.push("end-B");

      return value;
    });

    const keyA = ["parallel-test", "A"] as const;
    const keyB = ["parallel-test", "B"] as const;

    const { result: resultA } = renderHook(
      () => useScopedMutation<void, string>(keyA, "scope-A", mutationFnA),
      { wrapper },
    );
    const { result: resultB } = renderHook(
      () => useScopedMutation<void, string>(keyB, "scope-B", mutationFnB),
      { wrapper },
    );

    await act(async () => {
      resultA.current.mutate();
      resultB.current.mutate();
      await Promise.resolve();
    });

    expect(order).toEqual(["start-A", "start-B"]);

    await act(async () => {
      deferredA.resolve("A-done");
      deferredB.resolve("B-done");
      await Promise.all([deferredA.promise, deferredB.promise]);
    });

    expect(order).toContain("end-A");
    expect(order).toContain("end-B");
  });

  it("clears mutation defaults on unmount", async () => {
    const queryClient = new QueryClient();
    const wrapper = buildWrapper(queryClient);
    const mutationKey = ["scoped-mutation-test", "cleanup"] as const;

    const mutationFn = vi.fn(async () => "value");

    const { unmount } = renderHook(
      () => useScopedMutation<void, string>(mutationKey, "cleanup-scope", mutationFn),
      { wrapper },
    );

    expect(queryClient.getMutationDefaults(mutationKey)).toMatchObject({
      scope: { id: "cleanup-scope" },
    });

    unmount();

    const cleared = queryClient.getMutationDefaults(mutationKey);

    expect(cleared.scope).toBeUndefined();
  });
});
