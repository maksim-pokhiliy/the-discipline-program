import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CreateModifierData, Modifier } from "@repo/contracts/lms/modifier";
import type * as Query from "@repo/query";

import { platformKeys } from "../api/keys";

const createModifierMock = vi.fn<(data: CreateModifierData) => Promise<Modifier>>();
const notifyErrorMock = vi.fn<(error: Error, fallback: string) => void>();

vi.mock("../api", () => ({
  api: {
    modifiers: {
      create: (data: CreateModifierData) => createModifierMock(data),
    },
  },
}));

vi.mock("@repo/query", async (importOriginal) => {
  const actual = await importOriginal<typeof Query>();

  return {
    ...actual,
    notifyError: (error: Error, fallback: string) => notifyErrorMock(error, fallback),
  };
});

const { useCreateModifier } = await import("./use-create-modifier");

const NOW = new Date("2026-01-06T00:00:00.000Z");
const MODIFIER_ID = "clp9z8x7w0000abcd12mod0001";

const renderRunner = () => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const view = renderHook(() => useCreateModifier(), { wrapper });

  return { view, invalidateSpy };
};

describe("useCreateModifier", () => {
  beforeEach(() => {
    createModifierMock.mockReset();
    notifyErrorMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("invalidates the modifier search key on a successful create", async () => {
    createModifierMock.mockResolvedValueOnce({
      id: MODIFIER_ID,
      name: "from sofa",
      nameLower: "from sofa",
      notes: null,
      createdAt: NOW,
      updatedAt: NOW,
    } satisfies Modifier);

    const { view, invalidateSpy } = renderRunner();

    await act(async () => {
      view.result.current.mutate({ name: "from sofa", notes: null });
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(createModifierMock).toHaveBeenCalledWith({ name: "from sofa", notes: null });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: platformKeys.modifiers.search() });
    expect(notifyErrorMock).not.toHaveBeenCalled();
  });

  it("notifies the coach with the fallback message when the create fails", async () => {
    const failure = new Error("conflict");

    createModifierMock.mockRejectedValueOnce(failure);

    const { view } = renderRunner();

    await act(async () => {
      view.result.current.mutate({ name: "from sofa", notes: null });
    });

    await waitFor(() => expect(view.result.current.isError).toBe(true));

    expect(notifyErrorMock).toHaveBeenCalledWith(failure, "Failed to create modifier");
  });
});
