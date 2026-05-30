import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { render } from "@app/test/render";

import { AlternatingSetsForm, alternatingSetsDefaultParams } from "./alternating-sets-schema-form";
import {
  CompositeIntervalsWRFixedForm,
  compositeIntervalsWRFixedDefaultParams,
} from "./composite-intervals-work-rest-fixed-schema-form";
import {
  CompositeIntervalsWRProgressiveForm,
  compositeIntervalsWRProgressiveDefaultParams,
} from "./composite-intervals-work-rest-progressive-schema-form";
import {
  CompositeRollingRoundsForm,
  compositeRollingRoundsDefaultParams,
} from "./composite-rolling-rounds-schema-form";
import { EmomNestedForm, emomNestedDefaultParams } from "./emom-nested-schema-form";
import {
  NestedCompositeOverLadderForm,
  nestedCompositeOverLadderDefaultParams,
} from "./nested-composite-over-ladder-schema-form";
import { NestedRoundsForm, nestedRoundsDefaultParams } from "./nested-rounds-schema-form";
import { PARALLEL_PYRAMIDS_DEFAULT, ParallelPyramidsForm } from "./parallel-pyramids-schema-form";
import {
  SingleLineTotalCounterForm,
  singleLineTotalCounterDefaultParams,
} from "./single-line-total-counter-schema-form";
import { TimeWindowForm, timeWindowDefaultParams } from "./time-window-schema-form";

const onChange: Mock = vi.fn();

afterEach(() => {
  onChange.mockReset();
});

describe("AlternatingSetsForm renders the default set enumeration", () => {
  it("shows the [1,3,5] cells and the add step affordance", () => {
    render(<AlternatingSetsForm value={alternatingSetsDefaultParams} onChange={onChange} />);

    expect(screen.getByDisplayValue("1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "add step" })).toBeInTheDocument();
  });
});

describe("EmomNestedForm renders the default duration", () => {
  it("shows the duration field seeded to 10 and an empty rounds field", () => {
    render(<EmomNestedForm value={emomNestedDefaultParams} onChange={onChange} />);

    expect(screen.getByRole("spinbutton", { name: "Duration (min)" })).toHaveValue(10);
    expect(screen.getByRole("spinbutton", { name: "Rounds" })).toHaveValue(null);
  });
});

describe("CompositeIntervalsWRFixedForm renders the default fields", () => {
  it("shows intervals, work and rest seeded to the defaults", () => {
    render(
      <CompositeIntervalsWRFixedForm
        value={compositeIntervalsWRFixedDefaultParams}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("spinbutton", { name: "Intervals" })).toHaveValue(8);
    expect(screen.getByRole("spinbutton", { name: "Work (min)" })).toHaveValue(3);
    expect(screen.getByRole("spinbutton", { name: "Rest (min)" })).toHaveValue(1);
  });
});

describe("CompositeIntervalsWRProgressiveForm renders the default fields", () => {
  it("shows the numeric fields and the seeded CSV progressive seed", () => {
    render(
      <CompositeIntervalsWRProgressiveForm
        value={compositeIntervalsWRProgressiveDefaultParams}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("spinbutton", { name: "Sets" })).toHaveValue(5);
    expect(screen.getByRole("textbox", { name: "Progressive seed" })).toHaveValue("5,10,15,20,25");
  });
});

describe("CompositeRollingRoundsForm renders the default fields", () => {
  it("shows everyNth, rounds and total seeded to the defaults", () => {
    render(
      <CompositeRollingRoundsForm
        value={compositeRollingRoundsDefaultParams}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("spinbutton", { name: "Every Nth (min)" })).toHaveValue(3);
    expect(screen.getByRole("spinbutton", { name: "Rounds" })).toHaveValue(5);
    expect(screen.getByRole("spinbutton", { name: "Total (min)" })).toHaveValue(15);
  });
});

describe("NestedRoundsForm renders the default outer count", () => {
  it("shows a single count field seeded to 3 with a range toggle", () => {
    render(<NestedRoundsForm value={nestedRoundsDefaultParams} onChange={onChange} />);

    expect(screen.getByRole("spinbutton", { name: "Count" })).toHaveValue(3);
    expect(screen.getByRole("button", { name: "range" })).toBeInTheDocument();
  });
});

describe("NestedCompositeOverLadderForm renders the default fields", () => {
  it("shows a plain rounds field (no count-range toggle) and the mandatory rest fields", () => {
    render(
      <NestedCompositeOverLadderForm
        value={nestedCompositeOverLadderDefaultParams}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("spinbutton", { name: "Rounds" })).toHaveValue(5);
    expect(screen.getAllByRole("button", { name: "range" })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "range", pressed: false })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Rest value" })).toBeInTheDocument();
  });
});

describe("TimeWindowForm renders the default window", () => {
  it("shows the start and end text fields seeded to the default times", () => {
    render(<TimeWindowForm value={timeWindowDefaultParams} onChange={onChange} />);

    expect(screen.getByRole("textbox", { name: "Start" })).toHaveValue("09:30");
    expect(screen.getByRole("textbox", { name: "End" })).toHaveValue("09:50");
  });
});

describe("ParallelPyramidsForm renders the default pyramids", () => {
  it("shows two pyramid cards", () => {
    render(<ParallelPyramidsForm value={PARALLEL_PYRAMIDS_DEFAULT} onChange={onChange} />);

    expect(screen.getByText("Pyramid 1")).toBeInTheDocument();
    expect(screen.getByText("Pyramid 2")).toBeInTheDocument();
  });
});

describe("SingleLineTotalCounterForm renders the locked total-counter mode", () => {
  it("shows the confirm chip and never calls onChange for the seeded true flag (QA-21)", () => {
    render(
      <SingleLineTotalCounterForm
        value={singleLineTotalCounterDefaultParams}
        onChange={onChange}
      />,
    );

    expect(screen.getByText("total counter mode (sum of reps)")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
