import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { render } from "@app/test/render";

import { VoCard } from "./vo-card";

const onRemove: Mock = vi.fn();

describe("VoCard head", () => {
  it("renders the head label and its children", () => {
    render(
      <VoCard head="element">
        <span>card body</span>
      </VoCard>,
    );

    expect(screen.getByText("element")).toBeInTheDocument();
    expect(screen.getByText("card body")).toBeInTheDocument();
  });
});

describe("VoCard index badge", () => {
  it("renders the index digit when an index is given", () => {
    render(
      <VoCard head="element" index={2}>
        <span>card body</span>
      </VoCard>,
    );

    expect(screen.getByText("2")).toBeInTheDocument();
  });
});

describe("VoCard remove control", () => {
  it("omits the remove button when onRemove is not given", () => {
    render(
      <VoCard head="element">
        <span>card body</span>
      </VoCard>,
    );

    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
  });

  it("disables the remove button when canRemove is false", () => {
    render(
      <VoCard head="element" onRemove={onRemove} canRemove={false}>
        <span>card body</span>
      </VoCard>,
    );

    expect(screen.getByRole("button", { name: "Remove" })).toBeDisabled();
  });

  it("invokes onRemove when the enabled remove button is clicked", () => {
    render(
      <VoCard head="element" onRemove={onRemove} canRemove>
        <span>card body</span>
      </VoCard>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
