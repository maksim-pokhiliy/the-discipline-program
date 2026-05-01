import { type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const toastErrorMock = vi.fn();
const toastSuccessMock = vi.fn();

vi.mock("sonner", () => ({
  toast: { error: toastErrorMock, success: toastSuccessMock },
}));

const { createCrudHooks } = await import("./create-crud-hooks");

type Entity = { id: string; name: string };
type PageData = { items: Entity[] };

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

const buildKeys = () => ({
  page: () => ["entity", "page"] as const,
  byId: (id: string) => ["entity", "byId", id] as const,
});

const buildApi = () => {
  const getPageData = vi.fn(async (): Promise<PageData> => ({ items: [{ id: "1", name: "n" }] }));
  const getById = vi.fn(async (id: string): Promise<Entity> => ({ id, name: `n-${id}` }));
  const create = vi.fn(
    async (data: { name: string }): Promise<Entity> => ({
      id: "created",
      name: data.name,
    }),
  );
  const update = vi.fn(
    async (id: string, data: { name: string }): Promise<Entity> => ({ id, name: data.name }),
  );
  const deleteFn = vi.fn(async (_id: string) => undefined);

  return { getPageData, getById, create, update, delete: deleteFn };
};

describe("createCrudHooks", () => {
  beforeEach(() => {
    toastErrorMock.mockReset();
    toastSuccessMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("usePageData fetches via api.getPageData and returns the response", async () => {
    const queryClient = buildClient();
    const api = buildApi();
    const hooks = createCrudHooks<PageData, Entity, { name: string }, { name: string }>({
      entityName: "Entity",
      keys: buildKeys(),
      api,
    });

    const { result } = renderHook(() => hooks.usePageData(), {
      wrapper: buildWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ items: [{ id: "1", name: "n" }] });
    expect(api.getPageData).toHaveBeenCalledOnce();
  });

  it("useById fetches via api.getById and is disabled for empty id", async () => {
    const queryClient = buildClient();
    const api = buildApi();
    const hooks = createCrudHooks<PageData, Entity, { name: string }, { name: string }>({
      entityName: "Entity",
      keys: buildKeys(),
      api,
    });
    const wrapper = buildWrapper(queryClient);

    const disabled = renderHook(() => hooks.useById(""), { wrapper });

    expect(disabled.result.current.fetchStatus).toBe("idle");
    expect(api.getById).not.toHaveBeenCalled();

    const { result } = renderHook(() => hooks.useById("42"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: "42", name: "n-42" });
  });

  it("useCreate calls api.create, toasts success, invalidates the page key, and triggers navigation", async () => {
    const queryClient = buildClient();

    await queryClient.prefetchQuery({
      queryKey: ["entity", "page"],
      queryFn: () => ({ items: [] as Entity[] }),
    });

    const api = buildApi();
    const navigateSpy = vi.fn();
    const hooks = createCrudHooks<PageData, Entity, { name: string }, { name: string }>({
      entityName: "Entity",
      keys: buildKeys(),
      api,
      redirectTo: "/list",
      useNavigate: () => navigateSpy,
    });

    const { result } = renderHook(() => hooks.useCreate(), {
      wrapper: buildWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ name: "alice" });
    });

    expect(api.create).toHaveBeenCalledWith({ name: "alice" });
    expect(toastSuccessMock).toHaveBeenCalledWith("Entity created successfully");
    expect(navigateSpy).toHaveBeenCalledWith("/list");
    expect(queryClient.getQueryState(["entity", "page"])?.isInvalidated).toBe(true);
  });

  it("useCreate.onError routes through notifyError when api.create rejects with Zod issues", async () => {
    const queryClient = buildClient();
    const api = buildApi();

    api.create = vi.fn(async () => {
      throw Object.assign(new Error("validation failed"), {
        details: { issues: [{ path: "name", message: "must be unique" }] },
      });
    });

    const hooks = createCrudHooks<PageData, Entity, { name: string }, { name: string }>({
      entityName: "Entity",
      keys: buildKeys(),
      api,
    });

    const { result } = renderHook(() => hooks.useCreate(), {
      wrapper: buildWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ name: "x" }).catch(() => undefined);
    });

    expect(toastErrorMock).toHaveBeenCalledWith("name: must be unique");
  });

  it("useCreate.onError falls back to a 'Failed to create entity' message when no issues + no error.message", async () => {
    const queryClient = buildClient();
    const api = buildApi();

    api.create = vi.fn(async () => {
      throw new Error("");
    });

    const hooks = createCrudHooks<PageData, Entity, { name: string }, { name: string }>({
      entityName: "Entity",
      keys: buildKeys(),
      api,
    });

    const { result } = renderHook(() => hooks.useCreate(), {
      wrapper: buildWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ name: "x" }).catch(() => undefined);
    });

    expect(toastErrorMock).toHaveBeenCalledWith("Failed to create entity");
  });

  it("useUpdate invalidates both the page key and the byId key on success", async () => {
    const queryClient = buildClient();

    await queryClient.prefetchQuery({
      queryKey: ["entity", "page"],
      queryFn: () => ({ items: [] as Entity[] }),
    });

    await queryClient.prefetchQuery({
      queryKey: ["entity", "byId", "5"],
      queryFn: () => ({ id: "5", name: "n-5" }),
    });

    const api = buildApi();
    const hooks = createCrudHooks<PageData, Entity, { name: string }, { name: string }>({
      entityName: "Entity",
      keys: buildKeys(),
      api,
    });

    const { result } = renderHook(() => hooks.useUpdate(), {
      wrapper: buildWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ id: "5", data: { name: "renamed" } });
    });

    expect(api.update).toHaveBeenCalledWith("5", { name: "renamed" });
    expect(toastSuccessMock).toHaveBeenCalledWith("Entity updated successfully");
    expect(queryClient.getQueryState(["entity", "page"])?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(["entity", "byId", "5"])?.isInvalidated).toBe(true);
  });

  it("useDelete invalidates the page key on success", async () => {
    const queryClient = buildClient();

    await queryClient.prefetchQuery({
      queryKey: ["entity", "page"],
      queryFn: () => ({ items: [] as Entity[] }),
    });

    const api = buildApi();
    const hooks = createCrudHooks<PageData, Entity, { name: string }, { name: string }>({
      entityName: "Entity",
      keys: buildKeys(),
      api,
    });

    const { result } = renderHook(() => hooks.useDelete(), {
      wrapper: buildWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync("9");
    });

    expect(api.delete).toHaveBeenCalledWith("9");
    expect(toastSuccessMock).toHaveBeenCalledWith("Entity deleted successfully");
    expect(queryClient.getQueryState(["entity", "page"])?.isInvalidated).toBe(true);
  });

  it("useDelete.onError surfaces validation issues via notifyError", async () => {
    const queryClient = buildClient();
    const api = buildApi();

    api.delete = vi.fn(async () => {
      throw Object.assign(new Error("validation failed"), {
        details: { issues: [{ path: "id", message: "in use" }] },
      });
    });

    const hooks = createCrudHooks<PageData, Entity, { name: string }, { name: string }>({
      entityName: "Entity",
      keys: buildKeys(),
      api,
    });

    const { result } = renderHook(() => hooks.useDelete(), {
      wrapper: buildWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync("9").catch(() => undefined);
    });

    expect(toastErrorMock).toHaveBeenCalledWith("id: in use");
  });

  it("invalidates additional keys passed via additionalInvalidateKeys on every success", async () => {
    const queryClient = buildClient();

    await queryClient.prefetchQuery({
      queryKey: ["entity", "page"],
      queryFn: () => ({ items: [] as Entity[] }),
    });

    await queryClient.prefetchQuery({
      queryKey: ["other", "stat"],
      queryFn: () => 1,
    });

    const api = buildApi();
    const hooks = createCrudHooks<PageData, Entity, { name: string }, { name: string }>({
      entityName: "Entity",
      keys: buildKeys(),
      api,
      additionalInvalidateKeys: [["other", "stat"]],
    });

    const { result } = renderHook(() => hooks.useCreate(), {
      wrapper: buildWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ name: "n" });
    });

    expect(queryClient.getQueryState(["other", "stat"])?.isInvalidated).toBe(true);
  });

  it("useCreate throws when api.create is not configured", async () => {
    const queryClient = buildClient();
    const { getPageData, getById, update, delete: deleteFn } = buildApi();
    const hooks = createCrudHooks<PageData, Entity, { name: string }, { name: string }>({
      entityName: "Entity",
      keys: buildKeys(),
      api: { getPageData, getById, update, delete: deleteFn },
    });

    const { result } = renderHook(() => hooks.useCreate(), {
      wrapper: buildWrapper(queryClient),
    });

    await act(async () => {
      await expect(result.current.mutateAsync({ name: "x" })).rejects.toThrow(
        "Create is not supported for Entity",
      );
    });
  });
});
