import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { render } from "@app/test/render";

import { GroupSelectBar } from "./group-select-bar";

const onCancel = vi.fn();
const onGroup = vi.fn();

type RenderOptions = {
  selectedCount?: number;
  isPending?: boolean;
  groupLabel?: string;
};

const renderBar = ({
  selectedCount = 2,
  isPending = false,
  groupLabel = "Group rows",
}: RenderOptions = {}) =>
  render(
    <GroupSelectBar
      selectedCount={selectedCount}
      isPending={isPending}
      onCancel={onCancel}
      onGroup={onGroup}
      groupLabel={groupLabel}
    />,
  );

afterEach(() => {
  onCancel.mockReset();
  onGroup.mockReset();
});

describe("GroupSelectBar", () => {
  it("renders the 'Group rows' label for the row floor", () => {
    renderBar({ groupLabel: "Group rows" });

    expect(screen.getByRole("button", { name: "Group rows" })).toBeInTheDocument();
  });

  it("renders the 'Group schemas' label for the schema floor", () => {
    renderBar({ groupLabel: "Group schemas" });

    expect(screen.getByRole("button", { name: "Group schemas" })).toBeInTheDocument();
  });

  it("renders the selected-count caption", () => {
    renderBar({ selectedCount: 3 });

    expect(screen.getByText("3 selected")).toBeInTheDocument();
  });

  it("disables the group button below two selected", () => {
    renderBar({ selectedCount: 1, groupLabel: "Group schemas" });

    expect(screen.getByRole("button", { name: "Group schemas" })).toBeDisabled();
  });

  it("disables both actions while pending", () => {
    renderBar({ isPending: true, groupLabel: "Group schemas" });

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Group schemas" })).toBeDisabled();
  });

  it("fires onGroup and onCancel from their buttons", () => {
    renderBar({ groupLabel: "Group schemas" });

    fireEvent.click(screen.getByRole("button", { name: "Group schemas" }));
    expect(onGroup).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
