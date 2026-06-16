import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  CoachCredential,
  CreateCoachCredentialData,
  UpdateCoachCredentialData,
} from "@repo/contracts/coaching/coach-credential";
import type * as Query from "@repo/query";

import { platformKeys } from "../api/keys";

const createCredentialMock = vi.fn<(data: CreateCoachCredentialData) => Promise<CoachCredential>>();
const updateCredentialMock =
  vi.fn<(id: string, data: UpdateCoachCredentialData) => Promise<CoachCredential>>();
const deleteCredentialMock = vi.fn<(id: string) => Promise<void>>();
const notifyErrorMock = vi.fn<(error: Error, fallback: string) => void>();

vi.mock("../api", () => ({
  api: {
    coachCredentials: {
      create: (data: CreateCoachCredentialData) => createCredentialMock(data),
      update: (id: string, data: UpdateCoachCredentialData) => updateCredentialMock(id, data),
      delete: (id: string) => deleteCredentialMock(id),
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

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const { useCreateCredential, useUpdateCredential, useDeleteCredential } = await import(
  "./use-coach-credentials"
);

const NOW = new Date("2026-01-06T00:00:00.000Z");
const CREDENTIAL_ID = "clz00000000000000000cred1";
const COACH_PROFILE_ID = "clz00000000000000000prof1";

const buildCredential = (): CoachCredential => ({
  id: CREDENTIAL_ID,
  coachProfileId: COACH_PROFILE_ID,
  title: "Level 1 Trainer",
  issuer: "CrossFit",
  year: 2020,
  shownToAthletes: true,
  createdAt: NOW,
  updatedAt: NOW,
});

const renderRunner = <THook>(hook: () => THook) => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const view = renderHook(hook, { wrapper });

  return { view, invalidateSpy };
};

describe("useCreateCredential", () => {
  beforeEach(() => {
    createCredentialMock.mockReset();
    notifyErrorMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls api.coachCredentials.create with the payload and invalidates the profile key", async () => {
    createCredentialMock.mockResolvedValueOnce(buildCredential());

    const { view, invalidateSpy } = renderRunner(() => useCreateCredential());
    const payload: CreateCoachCredentialData = {
      title: "Level 1 Trainer",
      issuer: "CrossFit",
      year: 2020,
      shownToAthletes: true,
    };

    await act(async () => {
      view.result.current.mutate(payload);
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(createCredentialMock).toHaveBeenCalledWith(payload);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: platformKeys.coachProfile.data() });
  });

  it("notifies with the fallback message when the create fails", async () => {
    const failure = new Error("conflict");

    createCredentialMock.mockRejectedValueOnce(failure);

    const { view } = renderRunner(() => useCreateCredential());

    await act(async () => {
      view.result.current.mutate({
        title: "Level 1 Trainer",
        issuer: "CrossFit",
        year: 2020,
        shownToAthletes: true,
      });
    });

    await waitFor(() => expect(view.result.current.isError).toBe(true));

    expect(notifyErrorMock).toHaveBeenCalledWith(failure, "Failed to add credential");
  });
});

describe("useUpdateCredential", () => {
  beforeEach(() => {
    updateCredentialMock.mockReset();
    notifyErrorMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls api.coachCredentials.update with the id and data and invalidates the profile key", async () => {
    updateCredentialMock.mockResolvedValueOnce(buildCredential());

    const { view, invalidateSpy } = renderRunner(() => useUpdateCredential());
    const data: UpdateCoachCredentialData = { shownToAthletes: false };

    await act(async () => {
      view.result.current.mutate({ id: CREDENTIAL_ID, data });
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(updateCredentialMock).toHaveBeenCalledWith(CREDENTIAL_ID, data);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: platformKeys.coachProfile.data() });
  });
});

describe("useDeleteCredential", () => {
  beforeEach(() => {
    deleteCredentialMock.mockReset();
    notifyErrorMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls api.coachCredentials.delete with the id and invalidates the profile key", async () => {
    deleteCredentialMock.mockResolvedValueOnce(undefined);

    const { view, invalidateSpy } = renderRunner(() => useDeleteCredential());

    await act(async () => {
      view.result.current.mutate(CREDENTIAL_ID);
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(deleteCredentialMock).toHaveBeenCalledWith(CREDENTIAL_ID);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: platformKeys.coachProfile.data() });
  });
});
