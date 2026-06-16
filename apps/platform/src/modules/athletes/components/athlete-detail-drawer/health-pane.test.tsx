import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type AthleteProfile,
  Gender,
  HealthStatus,
} from "@repo/contracts/coaching/athlete-profile";

import { render } from "@app/test/render";

const ATHLETE_ID = "clz00000000000000000ath1";

const profileState = {
  data: undefined as AthleteProfile | undefined,
  isLoading: false,
};

vi.mock("@app/lib/hooks", () => ({
  useCoachAthleteProfile: () => ({ data: profileState.data, isLoading: profileState.isLoading }),
}));

const { HealthPane } = await import("./health-pane");

const makeProfile = (overrides: Partial<AthleteProfile> = {}): AthleteProfile => ({
  id: ATHLETE_ID,
  userId: ATHLETE_ID,
  gender: Gender.MALE,
  heightCm: 182,
  weightKg: 84,
  healthStatus: HealthStatus.INJURED,
  healthNote: "Tweaked shoulder, no overhead this week",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const makeSynthesizedDefault = (): AthleteProfile => ({
  id: ATHLETE_ID,
  userId: ATHLETE_ID,
  gender: null,
  heightCm: null,
  weightKg: null,
  healthStatus: HealthStatus.HEALTHY,
  healthNote: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

beforeEach(() => {
  profileState.data = makeProfile();
  profileState.isLoading = false;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HealthPane populated profile", () => {
  it("renders the metric values and health status", () => {
    render(<HealthPane athleteId={ATHLETE_ID} />);

    expect(screen.getByText("Male")).toBeInTheDocument();
    expect(screen.getByText("182")).toBeInTheDocument();
    expect(screen.getByText("84")).toBeInTheDocument();
    expect(screen.getByText("Injured")).toBeInTheDocument();
  });

  it("renders the coach health note when present", () => {
    render(<HealthPane athleteId={ATHLETE_ID} />);

    expect(screen.getByText("Tweaked shoulder, no overhead this week")).toBeInTheDocument();
  });
});

describe("HealthPane synthesized default", () => {
  it("renders dashes for unknown metrics and a healthy status", () => {
    profileState.data = makeSynthesizedDefault();

    render(<HealthPane athleteId={ATHLETE_ID} />);

    expect(screen.getAllByText("—")).toHaveLength(3);
    expect(screen.getByText("Healthy")).toBeInTheDocument();
  });

  it("omits the health-note block when there is no note", () => {
    profileState.data = makeSynthesizedDefault();

    render(<HealthPane athleteId={ATHLETE_ID} />);

    expect(screen.queryByText("Coach's note")).toBeNull();
  });
});

describe("HealthPane loading", () => {
  it("shows a spinner while the profile is loading", () => {
    profileState.data = undefined;
    profileState.isLoading = true;

    const { container } = render(<HealthPane athleteId={ATHLETE_ID} />);

    expect(container.querySelector(".MuiCircularProgress-root")).not.toBeNull();
  });
});
