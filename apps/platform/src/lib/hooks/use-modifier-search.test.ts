import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Modifier, ModifierSearchParams } from "@repo/contracts/lms/modifier";

import { platformKeys } from "../api/keys";

const searchMock = vi.fn<(params?: ModifierSearchParams) => Promise<Modifier[]>>();

vi.mock("../api", () => ({
  api: {
    modifiers: {
      search: (params?: ModifierSearchParams) => searchMock(params),
    },
  },
}));

const { useModifierSearch } = await import("./use-modifier-search");

const NOW = new Date("2026-01-06T00:00:00.000Z");

const makeModifier = (id: string, name: string): Modifier => ({
  id,
  name,
  nameLower: name.toLowerCase(),
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const renderRunner = (q?: string) => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const view = renderHook(() => useModifierSearch(q), { wrapper });

  return { view, queryClient };
};

describe("useModifierSearch", () => {
  beforeEach(() => {
    searchMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("queries the modifier search endpoint and caches under the search key for the term", async () => {
    const results = [makeModifier("clp9z8x7w0000abcd12mod0001", "from sofa")];

    searchMock.mockResolvedValueOnce(results);

    const { view, queryClient } = renderRunner("sofa");

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(searchMock).toHaveBeenCalledWith({ q: "sofa" });
    expect(view.result.current.data).toEqual(results);
    expect(queryClient.getQueryData(platformKeys.modifiers.search("sofa"))).toEqual(results);
  });

  it("caches under the no-term search key when no query is given", async () => {
    searchMock.mockResolvedValueOnce([]);

    const { view, queryClient } = renderRunner();

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(searchMock).toHaveBeenCalledWith({ q: undefined });
    expect(queryClient.getQueryData(platformKeys.modifiers.search())).toEqual([]);
  });
});
