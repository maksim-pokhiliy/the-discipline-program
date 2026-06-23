import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type Load } from "@repo/contracts/lms/_shared";

import { render } from "@app/test/render";

import { InlineProfilePicker } from "./inline-profile-picker";

const LEVEL_AXIS_ID = "clz00000000000000000axs01";
const SCALE_AXIS_ID = "clz00000000000000000axs02";
const SYSTEM_GENDER_AXIS_ID = "cgender000000000000000000";

const plainAxis = (axisId: string, label: string, values: string[]) => ({
  axisId,
  label,
  values,
  binding: null,
});

const genderAxis = {
  axisId: SYSTEM_GENDER_AXIS_ID,
  label: "Gender",
  values: ["Male", "Female"],
  binding: "GENDER" as const,
};

const byProfileLoad = (axes: Extract<Load, { kind: "byProfile" }>["axes"]): Load => ({
  kind: "byProfile",
  axes,
  cells: [],
});

const onPick = vi.fn();

beforeEach(() => {
  onPick.mockReset();
});

describe("InlineProfilePicker", () => {
  it("renders only the binding-null axis value buttons for a mixed plain+gender load (Must-Test 6)", () => {
    render(
      <InlineProfilePicker
        load={byProfileLoad([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"]), genderAxis])}
        selections={{}}
        isSubmitting={false}
        onPick={onPick}
      />,
    );

    expect(screen.getByRole("button", { name: "RX" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "SC" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Male" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Female" })).not.toBeInTheDocument();
  });

  it("titles the picker with the binding-null labels only, never the bound gender axis (Must-Test 6)", () => {
    render(
      <InlineProfilePicker
        load={byProfileLoad([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"]), genderAxis])}
        selections={{}}
        isSubmitting={false}
        onPick={onPick}
      />,
    );

    expect(screen.getByText("your Level")).toBeInTheDocument();
    expect(screen.queryByText(/Gender/)).not.toBeInTheDocument();
  });

  it("renders nothing for an all-gender (bound) byProfile load (Must-Test 7)", () => {
    const { container } = render(
      <InlineProfilePicker
        load={byProfileLoad([genderAxis])}
        selections={{}}
        isSubmitting={false}
        onPick={onPick}
      />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders nothing for a non-byProfile load (Must-Test 7)", () => {
    const { container } = render(
      <InlineProfilePicker
        load={{ kind: "bodyweight" }}
        selections={{}}
        isSubmitting={false}
        onPick={onPick}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("calls onPick with the axisId as the pick key, not the label (Must-Test 8)", () => {
    render(
      <InlineProfilePicker
        load={byProfileLoad([
          plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"]),
          plainAxis(SCALE_AXIS_ID, "Scale", ["M", "F"]),
        ])}
        selections={{}}
        isSubmitting={false}
        onPick={onPick}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "RX" }));

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith([LEVEL_AXIS_ID, SCALE_AXIS_ID], LEVEL_AXIS_ID, "RX");
  });

  it("marks the value button active by axisId-keyed selection (Must-Test 8)", () => {
    render(
      <InlineProfilePicker
        load={byProfileLoad([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])])}
        selections={{ [LEVEL_AXIS_ID]: "SC" }}
        isSubmitting={false}
        onPick={onPick}
      />,
    );

    expect(screen.getByRole("button", { name: "SC" })).toHaveClass("MuiButton-contained");
    expect(screen.getByRole("button", { name: "RX" })).toHaveClass("MuiButton-outlined");
  });
});
