import { type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ConflictError } from "@repo/errors";

import { type UseEditSessionConfig } from "./types";
import { useEditSession } from "./use-edit-session";

type Draft = { value: string; version?: number | undefined };

const draftSchema = z.object({
  value: z.string().min(1, "value is required"),
  version: z.number().optional(),
});

const buildWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  Wrapper.displayName = "TestWrapper";

  return Wrapper;
};

type HookConfig = UseEditSessionConfig<Draft>;

describe("useEditSession", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const baseConfig = (overrides: Partial<HookConfig> = {}): HookConfig => ({
    sessionId: "session-1",
    initial: { value: "alpha" },
    expectedVersion: 1,
    validate: (draft) => draftSchema.safeParse(draft),
    mutationKey: ["edit-session-test", overrides.sessionId ?? "session-1"] as const,
    mutationFn: vi.fn(async (draft: Draft, version: number) => ({
      ...draft,
      version: version + 1,
    })),
    idleSaveMs: 8000,
    savedFadeMs: 5000,
    ...overrides,
  });

  it("transitions idle -> dirty on valid dispatch and dirty-invalid on invalid dispatch", () => {
    const queryClient = new QueryClient();
    const wrapper = buildWrapper(queryClient);
    const config = baseConfig();
    const { result } = renderHook(() => useEditSession<Draft>(config), { wrapper });

    expect(result.current.status).toBe("idle");

    act(() => {
      result.current.dispatch({ value: "beta" });
    });
    expect(result.current.status).toBe("dirty");
    expect(result.current.isValid).toBe(true);

    act(() => {
      result.current.dispatch({ value: "" });
    });
    expect(result.current.status).toBe("dirty-invalid");
    expect(result.current.isValid).toBe(false);

    act(() => {
      result.current.dispatch({ value: "gamma" });
    });
    expect(result.current.status).toBe("dirty");
  });

  it("save() on invalid draft is a no-op and does not call mutationFn", async () => {
    const queryClient = new QueryClient();
    const wrapper = buildWrapper(queryClient);
    const mutationFn = vi.fn(async (draft: Draft, version: number) => ({
      ...draft,
      version: version + 1,
    }));
    const config = baseConfig({ mutationFn });
    const { result } = renderHook(() => useEditSession<Draft>(config), { wrapper });

    act(() => {
      result.current.dispatch({ value: "" });
    });
    expect(result.current.status).toBe("dirty-invalid");

    await act(async () => {
      await result.current.save();
    });

    expect(mutationFn).not.toHaveBeenCalled();
    expect(result.current.status).toBe("dirty-invalid");
  });

  it("idle 8s autosave fires when draft becomes dirty + valid", async () => {
    vi.useRealTimers();
    const queryClient = new QueryClient();
    const wrapper = buildWrapper(queryClient);
    const mutationFn = vi.fn(async (draft: Draft, version: number) => ({
      ...draft,
      version: version + 1,
    }));
    const config = baseConfig({ mutationFn, idleSaveMs: 50 });
    const { result } = renderHook(() => useEditSession<Draft>(config), { wrapper });

    act(() => {
      result.current.dispatch({ value: "beta" });
    });
    expect(result.current.status).toBe("dirty");

    await waitFor(
      () => {
        expect(mutationFn).toHaveBeenCalledTimes(1);
      },
      { timeout: 1000 },
    );
    expect(mutationFn).toHaveBeenCalledWith({ value: "beta" }, 1);
  });

  it("idle autosave does NOT fire while draft is dirty-invalid", async () => {
    vi.useRealTimers();
    const queryClient = new QueryClient();
    const wrapper = buildWrapper(queryClient);
    const mutationFn = vi.fn(async (draft: Draft, version: number) => ({
      ...draft,
      version: version + 1,
    }));
    const config = baseConfig({ mutationFn, idleSaveMs: 30 });
    const { result } = renderHook(() => useEditSession<Draft>(config), { wrapper });

    act(() => {
      result.current.dispatch({ value: "" });
    });

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(mutationFn).not.toHaveBeenCalled();
    expect(result.current.status).toBe("dirty-invalid");
  });

  it("blur on a child input does NOT trigger mutationFn — the §7.14 invariant", async () => {
    const queryClient = new QueryClient();
    const wrapper = buildWrapper(queryClient);
    const mutationFn = vi.fn(async (draft: Draft, version: number) => ({
      ...draft,
      version: version + 1,
    }));
    const config = baseConfig({ mutationFn });
    const { result } = renderHook(() => useEditSession<Draft>(config), { wrapper });

    act(() => {
      result.current.dispatch({ value: "beta" });
    });

    const fakeBlurEvent = new Event("blur");

    act(() => {
      window.dispatchEvent(fakeBlurEvent);
    });

    expect(mutationFn).not.toHaveBeenCalled();
    expect(result.current.status).toBe("dirty");
  });

  it("explicit save() on dirty + valid invokes mutationFn once and transitions saving -> saved", async () => {
    const queryClient = new QueryClient();
    const wrapper = buildWrapper(queryClient);
    const mutationFn = vi.fn(async (draft: Draft, version: number) => ({
      ...draft,
      version: version + 1,
    }));
    const onSaved = vi.fn();
    const config = baseConfig({ mutationFn, onSaved });
    const { result } = renderHook(() => useEditSession<Draft>(config), { wrapper });

    act(() => {
      result.current.dispatch({ value: "beta" });
    });

    await act(async () => {
      await result.current.save();
    });

    expect(mutationFn).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("saved");
    expect(result.current.expectedVersion).toBe(2);
    expect(onSaved).toHaveBeenCalledWith({ value: "beta", version: 2 });
  });

  it("auto-fades from saved -> idle after savedFadeMs", async () => {
    vi.useRealTimers();
    const queryClient = new QueryClient();
    const wrapper = buildWrapper(queryClient);
    const config = baseConfig({ savedFadeMs: 30 });
    const { result } = renderHook(() => useEditSession<Draft>(config), { wrapper });

    act(() => {
      result.current.dispatch({ value: "beta" });
    });
    await act(async () => {
      await result.current.save();
    });
    expect(result.current.status).toBe("saved");

    await waitFor(
      () => {
        expect(result.current.status).toBe("idle");
      },
      { timeout: 500 },
    );
  });

  it("a 409 ConflictError transitions to conflict status with currentVersion exposed", async () => {
    const queryClient = new QueryClient();
    const wrapper = buildWrapper(queryClient);
    const mutationFn = vi.fn(async () => {
      throw new ConflictError("conflict", { currentVersion: 9 });
    });
    const onConflict = vi.fn();
    const config = baseConfig({ mutationFn, onConflict });
    const { result } = renderHook(() => useEditSession<Draft>(config), { wrapper });

    act(() => {
      result.current.dispatch({ value: "beta" });
    });
    await act(async () => {
      await result.current.save();
    });

    expect(result.current.status).toBe("conflict");
    expect(result.current.conflict).toEqual({ currentVersion: 9 });
    expect(onConflict).toHaveBeenCalledWith(9);
  });

  it("expectedVersion increments on subsequent save", async () => {
    const queryClient = new QueryClient();
    const wrapper = buildWrapper(queryClient);
    const mutationFn = vi.fn(async (draft: Draft, version: number) => ({
      ...draft,
      version: version + 1,
    }));
    const config = baseConfig({ mutationFn });
    const { result } = renderHook(() => useEditSession<Draft>(config), { wrapper });

    act(() => {
      result.current.dispatch({ value: "beta" });
    });
    await act(async () => {
      await result.current.save();
    });
    expect(result.current.expectedVersion).toBe(2);

    act(() => {
      result.current.dispatch({ value: "gamma" });
    });
    await act(async () => {
      await result.current.save();
    });
    expect(mutationFn).toHaveBeenLastCalledWith({ value: "gamma" }, 2);
    expect(result.current.expectedVersion).toBe(3);
  });

  it("discard restores draft to initial and clears dirty state", () => {
    const queryClient = new QueryClient();
    const wrapper = buildWrapper(queryClient);
    const config = baseConfig();
    const { result } = renderHook(() => useEditSession<Draft>(config), { wrapper });

    act(() => {
      result.current.dispatch({ value: "beta" });
    });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.discard();
    });
    expect(result.current.isDirty).toBe(false);
    expect(result.current.draft).toEqual({ value: "alpha" });
  });

  it("schema accepts a Draft without version and the hook stores version as undefined", async () => {
    const queryClient = new QueryClient();
    const wrapper = buildWrapper(queryClient);
    const initialNoVersion: Draft = { value: "alpha" };
    const parsed = draftSchema.safeParse(initialNoVersion);

    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.version).toBeUndefined();
    }

    const mutationFn = vi.fn(async (draft: Draft, version: number) => ({
      ...draft,
      version: version + 1,
    }));
    const config = baseConfig({ initial: initialNoVersion, mutationFn });
    const { result } = renderHook(() => useEditSession<Draft>(config), { wrapper });

    expect(result.current.draft.version).toBeUndefined();

    act(() => {
      result.current.dispatch({ value: "beta" });
    });

    await act(async () => {
      await result.current.save();
    });

    expect(mutationFn).toHaveBeenCalledWith({ value: "beta" }, 1);
    expect(result.current.expectedVersion).toBe(2);
  });
});
