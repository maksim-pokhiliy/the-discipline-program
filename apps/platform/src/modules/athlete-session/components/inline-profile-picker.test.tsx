import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type Load } from "@repo/contracts/lms/_shared";

import { render } from "@app/test/render";

import { InlineProfilePicker } from "./inline-profile-picker";

const LEVEL_AXIS_ID = "clz00000000000000000axs01";
const SCALE_AXIS_ID = "clz00000000000000000axs02";

const catalogAxis = (axisId: string, label: string, values: string[]) => ({
  kind: "catalog" as const,
  axisId,
  label,
  values,
});

const humanAxis = { kind: "human" as const, attribute: "gender" as const };

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
  it("renders only the catalog axis value buttons for a mixed catalog+human load (Must-Test 6)", () => {
    render(
      <InlineProfilePicker
        load={byProfileLoad([catalogAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"]), humanAxis])}
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

  it("titles the picker with the catalog labels only, never the human arm (Must-Test 6)", () => {
    render(
      <InlineProfilePicker
        load={byProfileLoad([catalogAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"]), humanAxis])}
        selections={{}}
        isSubmitting={false}
        onPick={onPick}
      />,
    );

    expect(screen.getByText("your Level")).toBeInTheDocument();
    expect(screen.queryByText(/Gender/)).not.toBeInTheDocument();
  });

  it("renders nothing for an all-human byProfile load (Must-Test 7)", () => {
    const { container } = render(
      <InlineProfilePicker
        load={byProfileLoad([humanAxis])}
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
          catalogAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"]),
          catalogAxis(SCALE_AXIS_ID, "Scale", ["M", "F"]),
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
        load={byProfileLoad([catalogAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])])}
        selections={{ [LEVEL_AXIS_ID]: "SC" }}
        isSubmitting={false}
        onPick={onPick}
      />,
    );

    expect(screen.getByRole("button", { name: "SC" })).toHaveClass("MuiButton-contained");
    expect(screen.getByRole("button", { name: "RX" })).toHaveClass("MuiButton-outlined");
  });
});
