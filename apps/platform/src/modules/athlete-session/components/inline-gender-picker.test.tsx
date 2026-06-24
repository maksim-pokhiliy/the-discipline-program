import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type Load } from "@repo/contracts/lms/_shared";

import { render } from "@app/test/render";

import { InlineGenderPicker } from "./inline-gender-picker";

const LEVEL_AXIS_ID = "clz00000000000000000axs01";
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

describe("InlineGenderPicker", () => {
  it("renders the Male and Female buttons for a gender-bound byProfile load", () => {
    render(
      <InlineGenderPicker
        load={byProfileLoad([genderAxis])}
        isSubmitting={false}
        onPick={onPick}
      />,
    );

    expect(screen.getByRole("button", { name: "Male" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Female" })).toBeInTheDocument();
  });

  it("titles the picker with the bound gender axis label", () => {
    render(
      <InlineGenderPicker
        load={byProfileLoad([genderAxis])}
        isSubmitting={false}
        onPick={onPick}
      />,
    );

    expect(screen.getByText("your Gender")).toBeInTheDocument();
  });

  it("calls onPick with the picked value string, not an enum", () => {
    render(
      <InlineGenderPicker
        load={byProfileLoad([genderAxis])}
        isSubmitting={false}
        onPick={onPick}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Female" }));

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith("Female");
  });

  it("renders nothing for a non-byProfile load", () => {
    const { container } = render(
      <InlineGenderPicker load={{ kind: "bodyweight" }} isSubmitting={false} onPick={onPick} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders nothing for a byProfile load with no gender-bound axis", () => {
    const { container } = render(
      <InlineGenderPicker
        load={byProfileLoad([plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"])])}
        isSubmitting={false}
        onPick={onPick}
      />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("disables the value buttons while submitting", () => {
    render(<InlineGenderPicker load={byProfileLoad([genderAxis])} isSubmitting onPick={onPick} />);

    expect(screen.getByRole("button", { name: "Male" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Female" })).toBeDisabled();
  });
});
