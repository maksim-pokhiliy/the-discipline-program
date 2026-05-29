import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { render } from "@app/test/render";

import { PARALLEL_LADDERS_DEFAULTS, ParallelLaddersForm } from "./parallel-ladders-schema-form";
import type { ParamsFor } from "./schema-editor-types";

type ParallelLaddersParams = ParamsFor<"parallel-ladders-descending">;

const onChange: Mock<(next: ParallelLaddersParams) => void> = vi.fn();

afterEach(() => {
  onChange.mockReset();
});

const getRemoveButtons = (): HTMLElement[] => screen.getAllByRole("button", { name: "remove" });

describe("ParallelLaddersForm rendering", () => {
  it("renders the descending default with two ladder cards", () => {
    render(
      <ParallelLaddersForm
        value={PARALLEL_LADDERS_DEFAULTS.descending}
        onChange={onChange}
        mixed={false}
      />,
    );

    expect(screen.getByText("Ladder 1")).toBeInTheDocument();
    expect(screen.getByText("Ladder 2")).toBeInTheDocument();
  });

  it("shows the asc/desc segmented control per ladder in mixed mode", () => {
    render(
      <ParallelLaddersForm
        value={PARALLEL_LADDERS_DEFAULTS.mixed}
        onChange={onChange}
        mixed={true}
      />,
    );

    expect(screen.getAllByRole("button", { name: "Ascending" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Descending" })).toHaveLength(2);
  });

  it("does not show the asc/desc segmented control in non-mixed mode", () => {
    render(
      <ParallelLaddersForm
        value={PARALLEL_LADDERS_DEFAULTS.descending}
        onChange={onChange}
        mixed={false}
      />,
    );

    expect(screen.queryByRole("button", { name: "Ascending" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Descending" })).toBeNull();
  });
});

describe("ParallelLaddersForm add ladder", () => {
  it("appends a plain ladder with no direction in non-mixed mode", () => {
    render(
      <ParallelLaddersForm
        value={{ ladders: [{ steps: [21, 15, 9] }] }}
        onChange={onChange}
        mixed={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "+ add ladder" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      ladders: [{ steps: [21, 15, 9] }, { steps: [21, 15, 9] }],
    });
  });

  it("appends a ladder seeded with direction:'asc' in mixed mode (REV-I6)", () => {
    render(
      <ParallelLaddersForm
        value={{ ladders: [{ steps: [1, 2, 3], direction: "asc" }] }}
        onChange={onChange}
        mixed={true}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "+ add ladder" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      ladders: [
        { steps: [1, 2, 3], direction: "asc" },
        { steps: [21, 15, 9], direction: "asc" },
      ],
    });
  });

  it("never writes pairedWithInnerRowId on a freshly-added ladder", () => {
    render(
      <ParallelLaddersForm
        value={{
          ladders: [{ steps: [21, 15, 9], pairedWithInnerRowId: "clp9z8x7w0000abcd1234row1" }],
        }}
        onChange={onChange}
        mixed={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "+ add ladder" }));

    const next = onChange.mock.calls[0]?.[0];
    const addedLadder = next?.ladders[1];

    expect(addedLadder).toBeDefined();
    expect(addedLadder).not.toHaveProperty("pairedWithInnerRowId");
  });
});

describe("ParallelLaddersForm remove ladder", () => {
  it("disables remove when only one ladder remains", () => {
    render(
      <ParallelLaddersForm
        value={{ ladders: [{ steps: [21, 15, 9] }] }}
        onChange={onChange}
        mixed={false}
      />,
    );

    expect(getRemoveButtons()[0]).toBeDisabled();
  });

  it("emits onChange without the removed ladder when above the minimum", () => {
    render(
      <ParallelLaddersForm
        value={{ ladders: [{ steps: [21, 15, 9] }, { steps: [5, 3, 1] }] }}
        onChange={onChange}
        mixed={false}
      />,
    );

    fireEvent.click(getRemoveButtons()[1] as HTMLElement);

    expect(onChange).toHaveBeenCalledWith({ ladders: [{ steps: [21, 15, 9] }] });
  });
});

describe("ParallelLaddersForm direction toggle", () => {
  it("emits an updated direction while preserving the ladder steps in mixed mode", () => {
    render(
      <ParallelLaddersForm
        value={{ ladders: [{ steps: [1, 2, 3], direction: "asc" }] }}
        onChange={onChange}
        mixed={true}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Descending" }));

    expect(onChange).toHaveBeenCalledWith({
      ladders: [{ steps: [1, 2, 3], direction: "desc" }],
    });
  });
});
