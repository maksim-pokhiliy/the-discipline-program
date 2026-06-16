import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  type ProgressAthlete,
  type ProgressBuckets,
  ProcessStatus,
} from "@repo/contracts/coaching/coach-dashboard";

import { render } from "@app/test/render";

import { FallingBehindSection } from "./falling-behind-section";

const makeAthlete = (overrides: Partial<ProgressAthlete> = {}): ProgressAthlete => ({
  userId: "clz0000000000000000fall1",
  name: "Behind Bella",
  image: null,
  processStatus: ProcessStatus.FALLING_BEHIND,
  engagementPct: 42,
  weeklyDelta: -8,
  ...overrides,
});

const makeBuckets = (overrides: Partial<ProgressBuckets> = {}): ProgressBuckets => ({
  onTrack: [],
  steady: [],
  fallingBehind: [makeAthlete()],
  avgEngagementRate: 0.45,
  ...overrides,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FallingBehindSection visibility", () => {
  it("renders nothing when the falling-behind bucket is empty", () => {
    const { container } = render(
      <FallingBehindSection buckets={makeBuckets({ fallingBehind: [] })} onOpenAthlete={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the section when at least one athlete is falling behind", () => {
    render(<FallingBehindSection buckets={makeBuckets()} onOpenAthlete={vi.fn()} />);

    expect(screen.getByText("Falling behind")).toBeInTheDocument();
    expect(screen.getByText("Behind Bella")).toBeInTheDocument();
  });
});

describe("FallingBehindSection trend data", () => {
  it("shows engagement percent and weekly delta when present", () => {
    render(<FallingBehindSection buckets={makeBuckets()} onOpenAthlete={vi.fn()} />);

    expect(screen.getByText("42%")).toBeInTheDocument();
    expect(screen.getByText("wk Δ -8%")).toBeInTheDocument();
  });

  it("shows the average engagement in the section meta", () => {
    render(
      <FallingBehindSection
        buckets={makeBuckets({ avgEngagementRate: 0.45 })}
        onOpenAthlete={vi.fn()}
      />,
    );

    expect(screen.getByText("avg 45% engagement")).toBeInTheDocument();
  });

  it("omits the trend line when engagement and delta are absent", () => {
    render(
      <FallingBehindSection
        buckets={makeBuckets({
          fallingBehind: [makeAthlete({ engagementPct: null, weeklyDelta: null })],
        })}
        onOpenAthlete={vi.fn()}
      />,
    );

    expect(screen.queryByText(/Engagement/)).toBeNull();
    expect(screen.queryByText(/wk Δ/)).toBeNull();
  });
});

describe("FallingBehindSection interaction", () => {
  it("opens the athlete when a row is clicked", () => {
    const onOpenAthlete = vi.fn();

    render(<FallingBehindSection buckets={makeBuckets()} onOpenAthlete={onOpenAthlete} />);

    fireEvent.click(screen.getByText("Behind Bella"));

    expect(onOpenAthlete).toHaveBeenCalledWith("clz0000000000000000fall1");
  });
});
