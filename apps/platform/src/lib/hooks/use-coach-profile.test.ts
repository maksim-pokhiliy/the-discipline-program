import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  CoachProfilePageData,
  SelfUpdateCoachProfileData,
} from "@repo/contracts/coaching/coach-profile";
import { UserRole } from "@repo/contracts/iam/auth";
import type * as Query from "@repo/query";

import { platformKeys } from "../api/keys";

const updateProfileMock =
  vi.fn<(data: SelfUpdateCoachProfileData) => Promise<CoachProfilePageData>>();

vi.mock("../api", () => ({
  api: {
    coachProfile: {
      update: (data: SelfUpdateCoachProfileData) => updateProfileMock(data),
    },
  },
}));

vi.mock("@repo/query", async (importOriginal) => {
  const actual = await importOriginal<typeof Query>();

  return {
    ...actual,
    notifyError: vi.fn(),
  };
});

const { applyCoachProfileUpdate, useUpdateCoachProfile } = await import("./use-coach-profile");

const NOW = new Date("2026-01-06T00:00:00.000Z");

const buildPageData = (): CoachProfilePageData => ({
  user: {
    name: "Coach Denys",
    email: "coach@example.com",
    image: null,
    role: UserRole.COACH,
    timezone: "Europe/Kyiv",
    createdAt: NOW,
  },
  profile: {
    bio: "Original bio",
    location: "Kyiv, UA",
    specialties: ["CrossFit"],
  },
  credentials: [],
  trackRecord: {
    activeDuration: { years: 1, months: 0, days: 0 },
    athletesCoached: 4,
    plansAuthored: 7,
  },
});

const renderRunner = () => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const view = renderHook(() => useUpdateCoachProfile(), { wrapper });

  return { view, invalidateSpy };
};

describe("useUpdateCoachProfile", () => {
  beforeEach(() => {
    updateProfileMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls api.coachProfile.update with the request shape and invalidates the profile key", async () => {
    updateProfileMock.mockResolvedValueOnce(buildPageData());

    const { view, invalidateSpy } = renderRunner();

    await act(async () => {
      view.result.current.mutate({ name: "New Name" });
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(updateProfileMock).toHaveBeenCalledWith({ name: "New Name" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: platformKeys.coachProfile.data() });
  });
});

describe("applyCoachProfileUpdate", () => {
  it("merges a name change into the user slice without touching the profile slice", () => {
    const prev = buildPageData();

    const next = applyCoachProfileUpdate(prev, { name: "Renamed" });

    expect(next.user.name).toBe("Renamed");
    expect(next.user.email).toBe(prev.user.email);
    expect(next.profile).toEqual(prev.profile);
  });

  it("clears bio to null when bio is null", () => {
    const next = applyCoachProfileUpdate(buildPageData(), { bio: null });

    expect(next.profile.bio).toBeNull();
  });

  it("skips fields that are undefined", () => {
    const prev = buildPageData();

    const next = applyCoachProfileUpdate(prev, { name: "Renamed" });

    expect(next.profile.bio).toBe(prev.profile.bio);
    expect(next.profile.location).toBe(prev.profile.location);
    expect(next.user.timezone).toBe(prev.user.timezone);
  });

  it("merges image, timezone, location and specialties into the correct slice", () => {
    const next = applyCoachProfileUpdate(buildPageData(), {
      image: "https://blob.example.com/avatar.png",
      timezone: "America/New_York",
      location: "Lviv, UA",
      specialties: ["Powerlifting", "Mobility"],
    });

    expect(next.user.image).toBe("https://blob.example.com/avatar.png");
    expect(next.user.timezone).toBe("America/New_York");
    expect(next.profile.location).toBe("Lviv, UA");
    expect(next.profile.specialties).toEqual(["Powerlifting", "Mobility"]);
  });

  it("composes two sequential patches without clobbering across slices", () => {
    const prev = buildPageData();

    const afterName = applyCoachProfileUpdate(prev, { name: "Renamed" });
    const afterBio = applyCoachProfileUpdate(afterName, { bio: "Updated bio" });

    expect(afterBio.user.name).toBe("Renamed");
    expect(afterBio.profile.bio).toBe("Updated bio");
    expect(afterBio.profile.location).toBe(prev.profile.location);
  });
});
