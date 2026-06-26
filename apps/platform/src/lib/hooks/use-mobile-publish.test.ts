import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LegacyTrainingLevel, MobileAthlete } from "@repo/contracts/coaching/legacy-mobile";
import type {
  ConnectMobileData,
  MobileConnection,
} from "@repo/contracts/coaching/mobile-connection";
import type { CreateMobileLinkRequest, MobileLink } from "@repo/contracts/coaching/mobile-link";
import type {
  PublishMobileData,
  PublishMobileResult,
} from "@repo/contracts/coaching/mobile-publish";
import type * as Query from "@repo/query";

import { platformKeys } from "../api/keys";
import {
  makeMobileConnection,
  makeMobileLink,
  makePublishDayResult,
  mobileAthletesFixture,
  trainingLevelsFixture,
} from "../mobile.fixtures";

const connectMock = vi.fn<(data: ConnectMobileData) => Promise<MobileConnection>>();
const listConnectionsMock = vi.fn<() => Promise<MobileConnection[]>>();
const listTrainingLevelsMock = vi.fn<() => Promise<LegacyTrainingLevel[]>>();
const listAthletesMock = vi.fn<() => Promise<MobileAthlete[]>>();
const createLinkMock = vi.fn<(data: CreateMobileLinkRequest) => Promise<MobileLink>>();
const listLinksMock = vi.fn<(planId: string) => Promise<MobileLink[]>>();
const deleteLinkMock = vi.fn<(linkId: string) => Promise<void>>();
const publishMock = vi.fn<(data: PublishMobileData) => Promise<PublishMobileResult>>();
const notifyErrorMock = vi.fn<(error: Error, fallback: string) => void>();

vi.mock("../api", () => ({
  api: {
    mobile: {
      connect: (data: ConnectMobileData) => connectMock(data),
      listConnections: () => listConnectionsMock(),
      listTrainingLevels: () => listTrainingLevelsMock(),
      listAthletes: () => listAthletesMock(),
      createLink: (data: CreateMobileLinkRequest) => createLinkMock(data),
      listLinks: (planId: string) => listLinksMock(planId),
      deleteLink: (linkId: string) => deleteLinkMock(linkId),
      publish: (data: PublishMobileData) => publishMock(data),
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

const {
  useConnectMobile,
  useCreateMobileLink,
  useDeleteMobileLink,
  usePublishMobile,
  useMobileConnections,
  useMobileLinks,
  useMobileAthletes,
  useTrainingLevels,
} = await import("./use-mobile-publish");

const PLAN_ID = "ckplan1234567890abcdef0123";
const LINK_ID = "cklink1234567890abcdef0123";

const renderRunner = <THook>(hook: () => THook) => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const view = renderHook(hook, { wrapper });

  return { view, invalidateSpy };
};

beforeEach(() => {
  connectMock.mockReset();
  listConnectionsMock.mockReset();
  listTrainingLevelsMock.mockReset();
  listAthletesMock.mockReset();
  createLinkMock.mockReset();
  listLinksMock.mockReset();
  deleteLinkMock.mockReset();
  publishMock.mockReset();
  notifyErrorMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useMobileConnections", () => {
  it("queries api.mobile.listConnections under the connections key", async () => {
    const connections = [makeMobileConnection()];

    listConnectionsMock.mockResolvedValueOnce(connections);

    const { view } = renderRunner(() => useMobileConnections());

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(listConnectionsMock).toHaveBeenCalledTimes(1);
    expect(view.result.current.data).toEqual(connections);
  });
});

describe("useTrainingLevels", () => {
  it("does not fetch when disabled", () => {
    renderRunner(() => useTrainingLevels(false));

    expect(listTrainingLevelsMock).not.toHaveBeenCalled();
  });

  it("fetches api.mobile.listTrainingLevels when enabled", async () => {
    listTrainingLevelsMock.mockResolvedValueOnce(trainingLevelsFixture);

    const { view } = renderRunner(() => useTrainingLevels(true));

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(listTrainingLevelsMock).toHaveBeenCalledTimes(1);
    expect(view.result.current.data).toEqual(trainingLevelsFixture);
  });
});

describe("useMobileAthletes", () => {
  it("does not fetch when disabled", () => {
    renderRunner(() => useMobileAthletes(false));

    expect(listAthletesMock).not.toHaveBeenCalled();
  });

  it("fetches api.mobile.listAthletes when enabled", async () => {
    listAthletesMock.mockResolvedValueOnce(mobileAthletesFixture);

    const { view } = renderRunner(() => useMobileAthletes(true));

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(listAthletesMock).toHaveBeenCalledTimes(1);
    expect(view.result.current.data).toEqual(mobileAthletesFixture);
  });
});

describe("useMobileLinks", () => {
  it("queries api.mobile.listLinks with the planId", async () => {
    const links = [makeMobileLink()];

    listLinksMock.mockResolvedValueOnce(links);

    const { view } = renderRunner(() => useMobileLinks(PLAN_ID));

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(listLinksMock).toHaveBeenCalledWith(PLAN_ID);
    expect(view.result.current.data).toEqual(links);
  });
});

describe("useConnectMobile", () => {
  const payload: ConnectMobileData = { email: "coach@example.com", password: "secret" };

  it("calls api.mobile.connect and invalidates the connections, trainingLevels, and athletes keys", async () => {
    connectMock.mockResolvedValueOnce(makeMobileConnection());

    const { view, invalidateSpy } = renderRunner(() => useConnectMobile());

    await act(async () => {
      view.result.current.mutate(payload);
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(connectMock).toHaveBeenCalledWith(payload);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: platformKeys.mobile.connections() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: platformKeys.mobile.trainingLevels() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: platformKeys.mobile.athletes() });
  });

  it("notifies with the fallback message when the connect fails", async () => {
    const failure = new Error("bad credentials");

    connectMock.mockRejectedValueOnce(failure);

    const { view } = renderRunner(() => useConnectMobile());

    await act(async () => {
      view.result.current.mutate(payload);
    });

    await waitFor(() => expect(view.result.current.isError).toBe(true));

    expect(notifyErrorMock).toHaveBeenCalledWith(failure, "Failed to connect mobile app");
  });
});

describe("useCreateMobileLink", () => {
  const payload: CreateMobileLinkRequest = { planId: PLAN_ID, legacyLevelId: 2 };

  it("calls api.mobile.createLink and invalidates the links key for the plan", async () => {
    createLinkMock.mockResolvedValueOnce(makeMobileLink());

    const { view, invalidateSpy } = renderRunner(() => useCreateMobileLink(PLAN_ID));

    await act(async () => {
      view.result.current.mutate(payload);
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(createLinkMock).toHaveBeenCalledWith(payload);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: platformKeys.mobile.links(PLAN_ID) });
  });

  it("notifies with the fallback message when the create fails", async () => {
    const failure = new Error("conflict");

    createLinkMock.mockRejectedValueOnce(failure);

    const { view } = renderRunner(() => useCreateMobileLink(PLAN_ID));

    await act(async () => {
      view.result.current.mutate(payload);
    });

    await waitFor(() => expect(view.result.current.isError).toBe(true));

    expect(notifyErrorMock).toHaveBeenCalledWith(failure, "Failed to link training level");
  });
});

describe("useDeleteMobileLink", () => {
  it("calls api.mobile.deleteLink with the linkId and invalidates the links key", async () => {
    deleteLinkMock.mockResolvedValueOnce(undefined);

    const { view, invalidateSpy } = renderRunner(() => useDeleteMobileLink(PLAN_ID));

    await act(async () => {
      view.result.current.mutate(LINK_ID);
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(deleteLinkMock).toHaveBeenCalledWith(LINK_ID);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: platformKeys.mobile.links(PLAN_ID) });
  });

  it("notifies with the fallback message when the delete fails", async () => {
    const failure = new Error("gone");

    deleteLinkMock.mockRejectedValueOnce(failure);

    const { view } = renderRunner(() => useDeleteMobileLink(PLAN_ID));

    await act(async () => {
      view.result.current.mutate(LINK_ID);
    });

    await waitFor(() => expect(view.result.current.isError).toBe(true));

    expect(notifyErrorMock).toHaveBeenCalledWith(failure, "Failed to unlink training level");
  });
});

describe("usePublishMobile", () => {
  const payload: PublishMobileData = {
    linkId: LINK_ID,
    startDate: "2026-01-05",
    scope: "week",
    overwriteUnowned: false,
  };

  it("calls api.mobile.publish and returns the PublishMobileResult from mutateAsync", async () => {
    const result: PublishMobileResult = { results: [makePublishDayResult({ action: "created" })] };

    publishMock.mockResolvedValueOnce(result);

    const { view } = renderRunner(() => usePublishMobile());

    let resolved: PublishMobileResult | undefined;

    await act(async () => {
      resolved = await view.result.current.mutateAsync(payload);
    });

    expect(publishMock).toHaveBeenCalledWith(payload);
    expect(resolved).toEqual(result);
  });

  it("does not toast or notifyError on failure (the modal is the feedback surface)", async () => {
    const failure = new Error("reconnect required");

    publishMock.mockRejectedValueOnce(failure);

    const { view } = renderRunner(() => usePublishMobile());

    await act(async () => {
      await expect(view.result.current.mutateAsync(payload)).rejects.toBe(failure);
    });

    expect(notifyErrorMock).not.toHaveBeenCalled();
  });
});
