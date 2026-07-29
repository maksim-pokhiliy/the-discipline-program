import { type ReactNode } from "react";

import { onlineManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const toastErrorMock = vi.fn();

vi.mock("sonner", () => ({
  toast: { error: toastErrorMock, success: vi.fn() },
}));

const { useOptimisticMutation } = await import("./use-optimistic-mutation");

type Profile = { name: string };

const PROFILE_KEY = ["profile"] as const;
const OFFLINE_TIMEOUT_MS = 2000;

const buildWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  Wrapper.displayName = "TestQueryClientWrapper";

  return Wrapper;
};

const buildClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const renderProfileMutation = (
  queryClient: QueryClient,
  mutationFn: (vars: Profile) => Promise<unknown>,
  suppressErrorToast = false,
) =>
  renderHook(
    () =>
      useOptimisticMutation<Profile, Profile>({
        mutationFn,
        queryKey: () => PROFILE_KEY,
        transform: (previous, vars) => ({ ...previous, ...vars }),
        invalidateKeys: () => [PROFILE_KEY],
        errorMessage: "Failed to update profile",
        suppressErrorToast,
      }),
    { wrapper: buildWrapper(queryClient) },
  );

beforeEach(() => {
  toastErrorMock.mockReset();
});

afterEach(() => {
  onlineManager.setOnline(true);
  vi.restoreAllMocks();
});

describe("useOptimisticMutation", () => {
  it("applies the transform to the cache before the server answers", async () => {
    const queryClient = buildClient();

    queryClient.setQueryData(PROFILE_KEY, { name: "before" });

    const { result } = renderProfileMutation(queryClient, () => Promise.resolve(undefined));

    await act(async () => {
      await result.current.mutateAsync({ name: "after" });
    });

    expect(queryClient.getQueryData(PROFILE_KEY)).toEqual({ name: "after" });
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it(
    "fails an offline mutation instead of pausing it, and rolls the cache back",
    async () => {
      onlineManager.setOnline(false);

      const queryClient = buildClient();

      queryClient.setQueryData(PROFILE_KEY, { name: "before" });

      const mutationFn = vi.fn(() => Promise.reject(new Error("Failed to fetch")));
      const { result } = renderProfileMutation(queryClient, mutationFn);

      await act(async () => {
        await expect(result.current.mutateAsync({ name: "after" })).rejects.toThrow(
          "Failed to fetch",
        );
      });

      expect(mutationFn).toHaveBeenCalledTimes(1);
      expect(queryClient.getQueryData(PROFILE_KEY)).toEqual({ name: "before" });
      expect(toastErrorMock).toHaveBeenCalledWith("Failed to fetch");
    },
    OFFLINE_TIMEOUT_MS,
  );

  it("still rolls the cache back when the caller suppresses the error toast", async () => {
    const queryClient = buildClient();

    queryClient.setQueryData(PROFILE_KEY, { name: "before" });

    const { result } = renderProfileMutation(
      queryClient,
      () => Promise.reject(new Error("boom")),
      true,
    );

    await act(async () => {
      await expect(result.current.mutateAsync({ name: "after" })).rejects.toThrow("boom");
    });

    expect(queryClient.getQueryData(PROFILE_KEY)).toEqual({ name: "before" });
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it(
    "suppresses the toast on the offline path too, cache rollback included",
    async () => {
      onlineManager.setOnline(false);

      const queryClient = buildClient();

      queryClient.setQueryData(PROFILE_KEY, { name: "before" });

      const { result } = renderProfileMutation(
        queryClient,
        () => Promise.reject(new Error("Failed to fetch")),
        true,
      );

      await act(async () => {
        await expect(result.current.mutateAsync({ name: "after" })).rejects.toThrow(
          "Failed to fetch",
        );
      });

      expect(queryClient.getQueryData(PROFILE_KEY)).toEqual({ name: "before" });
      expect(toastErrorMock).not.toHaveBeenCalled();
    },
    OFFLINE_TIMEOUT_MS,
  );
});
