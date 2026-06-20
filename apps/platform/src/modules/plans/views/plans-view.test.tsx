import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  type CoachPlansPageData,
  type TrainingPlan,
  TrainingPlanStatus,
} from "@repo/contracts/lms/training-plan";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/coach/plans",
  useSearchParams: () => new URLSearchParams(),
}));

const pageDataMock = vi.fn();

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useTrainingPlansPageData: () => pageDataMock(),
  };
});

const { PlansView } = await import("./plans-view");

const NOW = new Date("2026-06-20T00:00:00.000Z");

const makePlan = (overrides: Partial<TrainingPlan> & Pick<TrainingPlan, "id">): TrainingPlan => ({
  creatorId: "clz00000000000000000coach",
  name: "Strength Block",
  description: null,
  status: TrainingPlanStatus.ACTIVE,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const setLoaded = (data: CoachPlansPageData): void => {
  pageDataMock.mockReturnValue({ data, isLoading: false, error: null });
};

const setLoading = (): void => {
  pageDataMock.mockReturnValue({ data: undefined, isLoading: true, error: null });
};

afterEach(() => {
  pageDataMock.mockReset();
});

describe("PlansView eyebrow gating", () => {
  it("renders the Plans title and an active-count eyebrow once data loads", () => {
    setLoaded({
      plans: [
        makePlan({ id: "clz0000000000000000plan01", status: TrainingPlanStatus.ACTIVE }),
        makePlan({ id: "clz0000000000000000plan02", status: TrainingPlanStatus.ACTIVE }),
        makePlan({ id: "clz0000000000000000plan03", status: TrainingPlanStatus.DRAFT }),
      ],
    });

    render(<PlansView />);

    expect(screen.getByRole("heading", { name: "Plans" })).toBeInTheDocument();
    expect(screen.getByText("2 active")).toBeInTheDocument();
  });

  it("shows a zero-count eyebrow when no plan is active", () => {
    setLoaded({
      plans: [makePlan({ id: "clz0000000000000000plan04", status: TrainingPlanStatus.DRAFT })],
    });

    render(<PlansView />);

    expect(screen.getByText("0 active")).toBeInTheDocument();
  });

  it("omits the eyebrow (no count, no 'undefined') while data is loading", () => {
    setLoading();

    render(<PlansView />);

    expect(screen.getByRole("heading", { name: "Plans" })).toBeInTheDocument();
    expect(screen.queryByText(/active/)).toBeNull();
    expect(screen.queryByText(/undefined/)).toBeNull();
  });
});
